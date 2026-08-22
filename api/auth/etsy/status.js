/**
 * Etsy Auth Status
 * GET /api/auth/etsy/status
 * Check if user is authenticated with Etsy
 */

export default async function handler(req, res) {
    const accessToken = req.cookies.etsy_token;

    if (accessToken) {
        return res.status(200).json({
            authenticated: true,
            message: 'Connected to Etsy',
        });
    }

    return res.status(200).json({
        authenticated: false,
        message: 'Not connected - visit /api/auth/etsy to authorize',
    });
}
