import React, { useState } from 'react';
import { db, auth } from '../firebase/config';
import { collection, addDoc } from 'firebase/firestore';

const colors = ['#F9D949', '#9FBB73', '#F5A7A7', '#B47BCD', '#7AD7F0', '#B4B4B3', '#586F7C'];

const AddNotePopup = ({ onClose }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [color, setColor] = useState(colors[0]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const user = auth.currentUser;
        if (user) {
            try {
                await addDoc(collection(db, `users/${user.uid}/notes`), {
                    userId: user.uid,
                    title,
                    content,
                    color,
                    createdAt: new Date()
                });
                onClose();
            } catch (error) {
                console.error('Error adding note:', error);
                alert('Failed to add note. Please try again.');
            }
        } else {
            alert('You must be logged in to add a note.');
        }
    };

    return (
        <div className="popup-overlay">
            <div className="popup-content">
                <h2>Add New Note</h2>
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />
                    <div className="color-picker">
                        {colors.map(c => (
                            <div
                                key={c}
                                className={`color-option ${color === c ? 'selected' : ''}`}
                                style={{ backgroundColor: c }}
                                onClick={() => setColor(c)}
                            ></div>
                        ))}
                    </div>
                    <textarea
                        placeholder="Content"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        required
                    ></textarea>
                    <div className="button-group">
                        <button type="submit">Add Note</button>
                        <button type="button" onClick={onClose}>Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddNotePopup;