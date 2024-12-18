import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const auth = async (req, res, next) => {
    try {
        console.log('Auth middleware - Checking request:', {
            path: req.path,
            cookies: req.cookies,
            headers: {
                authorization: req.headers.authorization,
                cookie: req.headers.cookie
            }
        });

        const token = req.cookies.token || 
                     (req.headers.authorization && req.headers.authorization.replace('Bearer ', ''));

        if (!token) {
            console.log('Auth middleware - No token found');
            return res.status(401).json({ error: 'Authentication required' });
        }

        console.log('Auth middleware - Token found, verifying...');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Auth middleware - Token verified:', decoded);

        const user = await User.findById(decoded.userId);
        if (!user) {
            console.log('Auth middleware - User not found');
            return res.status(401).json({ error: 'User not found' });
        }

        console.log('Auth middleware - User found:', {
            id: user._id,
            email: user.email,
            role: user.role
        });

        req.user = user;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({ error: 'Invalid token' });
    }
};

export default auth;
