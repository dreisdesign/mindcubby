#!/usr/bin/env python3
"""
Unit tests for PDF Catalog Generator modules (non-ReportLab dependent).
Run: python test_modules.py
"""

import sys
import tempfile
from pathlib import Path
from config import Config
from thumbnail_scanner import ThumbnailScanner


def test_config_defaults():
    """Test Config class with default values."""
    print("Testing Config defaults...", end=" ")
    config = Config()
    
    assert config.get("grid.images_per_row") == 6
    assert config.get("grid.rows_per_page") == 3
    assert config.get("image.width_inches") == 1.3
    
    print("✓")


def test_config_set_get():
    """Test Config set/get with dot notation."""
    print("Testing Config set/get...", end=" ")
    config = Config()
    
    config.set("grid.images_per_row", 8)
    assert config.get("grid.images_per_row") == 8
    
    config.set("custom.nested.value", "test")
    assert config.get("custom.nested.value") == "test"
    
    print("✓")


def test_config_yaml():
    """Test Config loading from YAML."""
    print("Testing Config YAML load...", end=" ")
    config = Config()
    
    yaml_content = """
grid:
  images_per_row: 8
  rows_per_page: 4
image:
  width_inches: 1.5
paths:
  input_dir: /custom/input
"""
    
    with tempfile.NamedTemporaryFile(mode='w', suffix='.yaml', delete=False) as f:
        f.write(yaml_content)
        yaml_file = f.name
    
    try:
        config.load_yaml(yaml_file)
        assert config.get("grid.images_per_row") == 8
        assert config.get("grid.rows_per_page") == 4
        assert config.get("image.width_inches") == 1.5
        assert config.get("paths.input_dir") == "/custom/input"
        print("✓")
    finally:
        Path(yaml_file).unlink()


def test_config_validation():
    """Test Config validation."""
    print("Testing Config validation...", end=" ")
    config = Config()
    
    # Valid config
    config.set("paths.input_dir", "/input")
    config.set("paths.output_pdf", "/output.pdf")
    config.set("grid.images_per_row", 6)
    config.set("grid.rows_per_page", 3)
    
    valid, error = config.validate()
    assert valid, f"Validation failed: {error}"
    
    # Invalid config (zero grid)
    config.set("grid.images_per_row", 0)
    valid, error = config.validate()
    assert not valid, "Should have failed with zero grid"
    
    print("✓")


def test_metadata_parsing():
    """Test filename metadata parsing."""
    print("Testing metadata parsing...", end=" ")
    
    # Test 1: Standard format
    metadata = ThumbnailScanner.parse_filename_metadata("top--tube--01--xs-18.0mm--smooth.png")
    assert metadata["position"] == "Top"
    assert metadata["type"] == "Tube"
    assert metadata["size_label"] == "XS"
    assert metadata["size_value"] == "18.0mm"
    assert metadata["texture"] == "Smooth"
    
    # Test 2: With underscores
    metadata = ThumbnailScanner.parse_filename_metadata("bottom--flat--02--md_25.5mm--ribbed.png")
    assert metadata["size_label"] == "MD"
    assert metadata["size_value"] == "25.5mm"
    
    # Test 3: Simple filename (fallback behavior)
    metadata = ThumbnailScanner.parse_filename_metadata("simple.png")
    assert metadata["position"] == "Simple"  # Single component = first position
    assert metadata["filename"] == "simple.png"
    
    print("✓")


def test_variant_title():
    """Test variant title generation."""
    print("Testing variant title generation...", end=" ")
    
    # Test 1: Full format
    title = ThumbnailScanner.get_variant_title("01_Stackable--Ribbed-Flat")
    assert "Ribbed" in title
    assert "Flat" in title
    
    # Test 2: Without number
    title = ThumbnailScanner.get_variant_title("Smooth-Tube")
    assert "Smooth" in title
    assert "Tube" in title
    
    print("✓")


def test_config_parse_value():
    """Test value type parsing."""
    print("Testing value type parsing...", end=" ")
    
    assert Config._parse_value("true") is True
    assert Config._parse_value("false") is False
    assert Config._parse_value("42") == 42
    assert Config._parse_value("3.14") == 3.14
    assert Config._parse_value("hello") == "hello"
    
    print("✓")


def run_all_tests():
    """Run all tests."""
    print("\n" + "=" * 60)
    print("📝 Running Unit Tests")
    print("=" * 60 + "\n")
    
    tests = [
        test_config_defaults,
        test_config_set_get,
        test_config_yaml,
        test_config_validation,
        test_metadata_parsing,
        test_variant_title,
        test_config_parse_value,
    ]
    
    passed = 0
    failed = 0
    
    for test in tests:
        try:
            test()
            passed += 1
        except Exception as e:
            import traceback
            print(f"✗")
            traceback.print_exc()
            failed += 1
    
    print("\n" + "=" * 60)
    print(f"Results: {passed} passed, {failed} failed")
    print("=" * 60 + "\n")
    
    return failed == 0


if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
