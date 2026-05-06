import User from '../models/User.js';

// @desc    Get all users
// @route   GET /api/users
// @access  Private
export const getUsers = async (req, res) => {
    try {
        // .select('-password') ensures we don't send hashed passwords to the frontend
        const users = await User.find({}).select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a user (Invited by Admin)
// @route   POST /api/users
// @access  Private/Admin
export const createUser = async (req, res) => {
    const { full_name, email, role } = req.body;

    try {
        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: 'User already exists' });

        const user = await User.create({
            full_name: full_name || email.split('@')[0],
            email,
            password: 'TemporaryPassword123!', // You'd normally email them a setup link
            role: role || 'user',
        });

        res.status(201).json({
            _id: user._id,
            full_name: user.full_name,
            email: user.email,
            role: user.role,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};