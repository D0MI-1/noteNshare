import React, { useState } from 'react';
import {auth} from '../firebase/config';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Link, useNavigate } from 'react-router-dom';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            await signInWithEmailAndPassword(auth, email, password);
            navigate('/dashboard');
        }catch (error){
            console.error('Error logging in:', error.message);
        }
    };

    return (
        <div className="login-container">
            <h1>Note'N'Share</h1>
            <form onSubmit={handleLogin}>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button type="submit" className="login-button">Login</button>
            </form>
            <Link to="/signup">
                <button className="signup-button">sign up</button>
            </Link>
            <Link to="/forgot-password" className="forgot-password-link">
                Forgot password?
            </Link>

        </div>
    );
};

export default Login;
