#!/usr/bin/env python3
"""
stl_rotate.py — Rotate an STL model and export as an animated GIF or MP4 video.

Dependencies (install one loader + the rendering stack):
    pip install numpy-stl matplotlib pillow          # GIF output
    pip install numpy-stl matplotlib pillow imageio  # video output (ffmpeg must also be on PATH)
  OR
    pip install trimesh matplotlib pillow

Usage examples:
    python3 stl_rotate.py model.stl
    python3 stl_rotate.py model.stl --output video
    python3 stl_rotate.py model.stl --frames 120 --fps 30 --elevation 30
    python3 stl_rotate.py model.stl --color gold --bg black --out-file spin.gif
    python3 stl_rotate.py model.stl --shading metallic --color silver --bg '#1a1a2e'
    python3 stl_rotate.py model.stl --output video --out-file model_spin.mp4
"""

import argparse
import os
import sys

import numpy as np
import matplotlib
matplotlib.use("Agg")  # headless backend, no display needed
import matplotlib.pyplot as plt
import matplotlib.animation as animation
from mpl_toolkits.mplot3d.art3d import Poly3DCollection


# ---------------------------------------------------------------------------
# STL loading — tries numpy-stl first, falls back to trimesh
# ---------------------------------------------------------------------------

def load_stl(path: str) -> np.ndarray:
    """Return triangles as ndarray of shape (N, 3, 3)."""
    try:
        from stl import mesh as stl_mesh
        m = stl_mesh.Mesh.from_file(path)
        return m.vectors  # shape (N, 3, 3)
    except ImportError:
        pass

    try:
        import trimesh
        m = trimesh.load(path, force="mesh")
        if hasattr(m, "triangles"):
            return np.array(m.triangles)
        # Scene with multiple geometries
        if hasattr(m, "geometry"):
            import trimesh.util
            combined = trimesh.util.concatenate(list(m.geometry.values()))
            return np.array(combined.triangles)
    except ImportError:
        pass

    sys.exit(
        "Error: no STL loader found.\n"
        "Install one with:  pip install numpy-stl   OR   pip install trimesh"
    )


# ---------------------------------------------------------------------------
# Rendering helpers
# ---------------------------------------------------------------------------

# Shading presets: (ambient, diffuse, specular, shininess)
SHADING_PRESETS = {
    "flat":     None,           # solid colour, no lighting
    "phong":    (0.25, 0.65, 0.25, 32),
    "metallic": (0.15, 0.50, 0.70, 128),
}


def _normalise(triangles: np.ndarray):
    """Center the model and return (centered_triangles, half_extent)."""
    verts = triangles.reshape(-1, 3)
    lo, hi = verts.min(axis=0), verts.max(axis=0)
    center = (lo + hi) / 2.0
    half_extent = (hi - lo).max() / 2.0 * 1.15  # small padding
    return triangles - center, half_extent


def _face_normals(triangles: np.ndarray) -> np.ndarray:
    """Compute unit normals for each triangle. Shape: (N, 3)."""
    v0, v1, v2 = triangles[:, 0], triangles[:, 1], triangles[:, 2]
    n = np.cross(v1 - v0, v2 - v0)
    lens = np.linalg.norm(n, axis=1, keepdims=True)
    lens = np.where(lens == 0, 1.0, lens)
    return n / lens


def _phong_face_colors(
    normals: np.ndarray,
    azim_rad: float,
    elev_rad: float,
    base_rgb: np.ndarray,
    ambient: float,
    diffuse: float,
    specular: float,
    shininess: float,
) -> np.ndarray:
    """
    Blinn-Phong per-face RGBA colours.
    Light is fixed ~45° ahead-and-above the camera (Preview-style).
    """
    # Light direction: tracks 45° ahead of camera azimuth, high elevation
    light_az = azim_rad + np.pi * 0.45
    light_el = np.radians(55)
    L = np.array([
        np.cos(light_el) * np.cos(light_az),
        np.cos(light_el) * np.sin(light_az),
        np.sin(light_el),
    ])
    L /= np.linalg.norm(L)

    # View direction
    V = np.array([
        np.cos(elev_rad) * np.cos(azim_rad),
        np.cos(elev_rad) * np.sin(azim_rad),
        np.sin(elev_rad),
    ])
    V /= np.linalg.norm(V)

    # Blinn-Phong half-vector
    H = L + V
    H /= np.linalg.norm(H)

    NdotL = normals @ L          # signed — use abs for two-sided faces
    diff = np.abs(NdotL) * diffuse

    NdotH = np.clip(normals @ H, 0.0, 1.0)
    spec = (NdotH ** shininess) * specular
    spec = np.where(NdotL > 0, spec, 0.0)  # specular only on lit side

    intensity = np.clip(ambient + diff, 0.0, 1.0)

    # Tint base colour by intensity, then add white specular highlight
    rgb = intensity[:, None] * base_rgb[None, :] + spec[:, None]
    rgb = np.clip(rgb, 0.0, 1.0)

    alpha = np.ones((len(rgb), 1))
    return np.hstack([rgb, alpha])


def make_animation(
    triangles: np.ndarray,
    *,
    frames: int,
    fps: int,
    elevation: float,
    output_format: str,
    output_path: str,
    color: str,
    bg_color: str,
    title: str,
    shading: str,
):
    centered, extent = _normalise(triangles)
    base_rgb = np.array(matplotlib.colors.to_rgb(color))
    preset = SHADING_PRESETS[shading]
    normals = _face_normals(centered) if preset is not None else None

    fig = plt.figure(figsize=(6, 6), dpi=120)
    ax = fig.add_subplot(111, projection="3d")

    fig.patch.set_facecolor(bg_color)
    ax.set_facecolor(bg_color)
    ax.set_axis_off()
    ax.set_xlim(-extent, extent)
    ax.set_ylim(-extent, extent)
    ax.set_zlim(-extent, extent)
    ax.set_box_aspect([1, 1, 1])

    elev_rad = np.radians(elevation)
    init_azim = 0.0

    if preset is not None:
        init_colors = _phong_face_colors(
            normals, init_azim, elev_rad, base_rgb, *preset
        )
        poly = Poly3DCollection(centered, facecolors=init_colors, edgecolor="none")
    else:
        poly = Poly3DCollection(centered, alpha=0.95, facecolor=color, edgecolor="none")

    ax.add_collection3d(poly)

    if title:
        text_color = "black" if bg_color in ("white", "#ffffff", "#fff") else "white"
        fig.suptitle(title, color=text_color, fontsize=11, y=0.97)

    def update(frame):
        azim_deg = 360.0 * frame / frames
        ax.view_init(elev=elevation, azim=azim_deg)
        if preset is not None:
            colors = _phong_face_colors(
                normals, np.radians(azim_deg), elev_rad, base_rgb, *preset
            )
            poly.set_facecolors(colors)
        return (poly,)

    ani = animation.FuncAnimation(
        fig, update, frames=frames, interval=1000 / fps, blit=False
    )

    if output_format == "gif":
        ani.save(output_path, writer="pillow", fps=fps)
    else:
        # Requires ffmpeg on PATH
        writer = animation.FFMpegWriter(fps=fps, codec="libx264",
                                        extra_args=["-pix_fmt", "yuv420p"])
        ani.save(output_path, writer=writer)

    plt.close(fig)
    print(f"Saved → {output_path}")


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Rotate an STL model and save as GIF or MP4.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument("stl_file", help="Path to the input .stl file")
    parser.add_argument(
        "--output", choices=["gif", "video"], default="gif",
        help="Output format: 'gif' (Pillow) or 'video' (MP4 via ffmpeg)",
    )
    parser.add_argument("--out-file", default="",
                        help="Output filename. Auto-derived from input if omitted.")
    parser.add_argument("--frames", type=int, default=72,
                        help="Total frames for one full 360° rotation.")
    parser.add_argument("--fps", type=int, default=24,
                        help="Frames per second.")
    parser.add_argument("--elevation", type=float, default=25.0,
                        help="Camera elevation angle in degrees.")
    parser.add_argument("--color", default="steelblue",
                        help="Model face color (any matplotlib color string).")
    parser.add_argument("--bg", default="black",
                        help="Background color.")
    parser.add_argument("--title", default="",
                        help="Optional text title overlaid on the animation.")
    parser.add_argument(
        "--shading", choices=["flat", "phong", "metallic"], default="metallic",
        help="Lighting model: flat=solid colour, phong=diffuse+specular, metallic=shiny (Preview-style).",
    )

    args = parser.parse_args()

    if not os.path.isfile(args.stl_file):
        sys.exit(f"Error: file not found: {args.stl_file!r}")

    ext = ".gif" if args.output == "gif" else ".mp4"
    if args.out_file:
        out_path = args.out_file
    else:
        base = os.path.splitext(os.path.abspath(args.stl_file))[0]
        out_path = base + "_rotate" + ext

    print(f"Loading  {args.stl_file} …")
    triangles = load_stl(args.stl_file)
    print(f"  {len(triangles):,} triangles")
    print(f"Rendering {args.frames} frames @ {args.fps} fps → {out_path}")

    make_animation(
        triangles,
        frames=args.frames,
        fps=args.fps,
        elevation=args.elevation,
        output_format=args.output,
        output_path=out_path,
        color=args.color,
        bg_color=args.bg,
        title=args.title,
        shading=args.shading,
    )


if __name__ == "__main__":
    main()
