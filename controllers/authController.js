import userModel from "../models/userModel.js";
import { comparePassword, hashPassword } from "../helpers/authHelper.js";
import JWT from "jsonwebtoken";
import orderModel from "../models/orderModel.js";

export const registerController = async (req, res) => {
    try {
        const { name, email, password, phone, address, key } = req.body;

        // Validations
        if (!name) {
            return res.send({ message: 'Name is Required' });
        }
        if (!email) {
            return res.send({ message: 'Email is Required' });
        }
        if (!password) {
            return res.send({ message: 'Password is Required' });
        }
        if (!phone) {
            return res.send({ message: 'Phone is Required' });
        }
        if (!address) {
            return res.send({ message: 'Address is Required' });
        }
        if (!key) {
            return res.send({ message: 'Secret Key is Required' });
        }

        // check user
        const existinguser = await userModel.findOne({ email });

        // exisiting user
        if (existinguser) {
            return res.status(400).send({
                success: false,
                error: "User already exists, please login"
            });
        }

        // register user
        const hashedPassword = await hashPassword(password);

        // save user
        const user = await new userModel({ name, email, password: hashedPassword, phone, address, key }).save();

        res.status(201).send({
            success: true,
            message: 'User Registered Successfully',
            user
        });

    } catch (error) {
        console.log(error)
        res.status(500).send({
            success: false,
            message: "Error in Registration",
            error
        });
    };
};

// Post  Login
export const loginController = async (req, res) => {
    try {
        const { email, password } = req.body;

        // validation
        if (!email || !password) {
            return res.status(400).send({
                success: false,
                message: "Invalid email or password"
            });
        };

        // check user
        const user = await userModel.findOne({ email })
        if (!user) {
            return res.status(404).send({
                success: false,
                message: "Email not resgistered!"
            });
        };
        const match = await comparePassword(password, user.password);
        if (!match) {
            return res.status(200).send({
                success: false,
                message: "invalid password"
            });
        };

        // token
        const token = await JWT.sign({ _id: user._id }, process.env.JWT_SECRET, {
            expiresIn: '7d'
        });
        res.status(200).send({
            success: true,
            message: "Login successful",
            user: {
                name: user.name,
                email: user.email,
                phone: user.phone,
                address: user.address,
                role: user.role,
            },
            token,
        });

    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error in login",
            error
        })
    }
};

// forget password
export const forgotPasswordController = async (req, res) => {
    try {
        const { email, key, newPassword } = req.body;
        // Validation
        if (!email) {
            return res.status(400).send({ message: 'Email is required' });
        }
        if (!key) {
            return res.status(400).send({ message: 'key is required ' });
        }
        if (!email) {
            return res.status(400).send({ message: 'new password is required' });
        }

        // Check user and key
        const user = await userModel.findOne({ email, key });
        if (!user) {
            return res.status(404).send({
                success: false,
                message: 'Wrong Email or Answer',
            });
        }

        // Hash new password and update user
        const hashedPassword = await hashPassword(newPassword);
        await userModel.findByIdAndUpdate(user._id, { password: hashedPassword });

        res.status(200).send({
            success: true,
            message: 'Password Reset Successfully',
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            success: false,
            message: "Something Went Wrong",
            error: error.message
        });
    }
};

// Test controller
export const testController = (req, res) => {
    try {
        res.send('Protected Route');
    } catch (error) {
        console.log(error);
        res.send({ error });
    }
};

// update profile
export const updateProfileController = async (req, res) => {
    try {
        const { name, email, password, address, phone } = req.body;
        const user = await userModel.findById(req.user._id);
        //password
        if (password && password.length < 6) {
            return res.json({ error: "Passsword is required and 6 character long" });
        }
        const hashedPassword = await hashPassword(password);
        const updatedUser = await userModel.findByIdAndUpdate(
            req.user._id,
            {
                name: name || user.name,
                password: hashedPassword || user.password,
                email: email || user.email,
                address: address || user.address,
                phone: phone || user.phone
            },
            { new: true }
        );
        res.status(200).send({
            success: true,
            message: "Profile Updated SUccessfully",
            updatedUser,
        });
    } catch (error) {
        console.log(error);
        res.status(400).send({
            success: false,
            message: "Error WHile Update profile",
            error,
        });
    }
};

// get orders
export const getOrdersController = async (req, res) => {
    try {
        const orders = await orderModel
            .find({ buyer: req.user._id })
            .populate("products", "-photo")
            .populate("buyer", "name");
        res.json(orders);
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error WHile Geting Orders",
            error,
        });
    }
};

// get all orders
export const getAllOrdersController = async (req, res) => {
    try {
        const orders = await orderModel
            .find({})
            .populate("products", "-photo")
            .populate("buyer", "name")
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error While Geting Orders",
            error,
        });
    }
};

// order status
export const orderStatusController = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;
        const orders = await orderModel.findByIdAndUpdate(
            orderId,
            { status },
            { new: true }
        );
        res.json(orders);
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error While Updateing Order",
            error,
        });
    }
};