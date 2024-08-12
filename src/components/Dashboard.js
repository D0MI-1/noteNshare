import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase/config';
import { collection, query, onSnapshot, orderBy , getDocs, getDoc, where} from 'firebase/firestore';
import AddNotePopup from './AddNotePopup';
import NoteCard from './NoteCard';
import FriendsButton from './FriendsButton';

const Dashboard = () => {
    const [notes, setNotes] = useState([]);
    const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);
    //const [user, setUser] = useState(null);
    const [expandedNoteId, setExpandedNoteId] = useState(null);
    const [sortOrder, setSortOrder] = useState('desc');

    useEffect(() => {
        const user = auth.currentUser;
        if (user) {
            // Fetch user's own notes
            const userNotesQuery = query(
                collection(db, `users/${user.uid}/notes`),
                orderBy('createdAt', sortOrder)
            );
            const unsubscribeUserNotes = onSnapshot(userNotesQuery, (snapshot) => {
                const userNotes = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    isOwner: true
                }));
                setNotes(prevNotes => {
                    const sharedNotes = prevNotes.filter(note => !note.isOwner);
                    return [...sharedNotes, ...userNotes];
                });
            });

            // Fetch shared notes
            const sharedNotesQuery = query(
                collection(db, `users/${user.uid}/notes`),
                where('sharedWith', 'array-contains', user.uid)
            );
            const unsubscribeSharedNotes = onSnapshot(sharedNotesQuery, (snapshot) => {
                const sharedNotes = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    isOwner: false
                }));
                setNotes(prevNotes => {
                    const userNotes = prevNotes.filter(note => note.isOwner);
                    return [...userNotes, ...sharedNotes];
                });
            });

            return () => {
                unsubscribeUserNotes();
                unsubscribeSharedNotes();
            };
        }
    }, [sortOrder]);

    const handleNoteUpdate = (updatedNote) => {
        setNotes(prevNotes => prevNotes.map(note =>
            note.id === updatedNote.id ? updatedNote : note
        ));
    };

    const handleNoteDelete = (deletedNoteId) => {
        setNotes(prevNotes => prevNotes.filter(note => note.id !== deletedNoteId));
    };
    const toggleSortOrder = () => {
        setSortOrder(prevOrder => prevOrder === 'desc' ? 'asc' : 'desc');
    };

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <button className="sort-button" onClick={toggleSortOrder}>
                    Sort {sortOrder === 'desc' ? '↓' : '↑'}
                </button>
                <FriendsButton/>
            </div>

            <div className="notes-container">
                {notes.map(note => (
                    <NoteCard
                        key={`${note.id}-${note.isShared ? 'shared' : 'own'}`}
                        note={note}
                        onUpdate={handleNoteUpdate}
                        onDelete={handleNoteDelete}
                        isExpanded={expandedNoteId === note.id}
                        setExpanded={(isExpanded) => setExpandedNoteId(isExpanded ? note.id : null)}
                    />
                ))}
            </div>
            <button className="fab" onClick={() => setIsAddNoteOpen(true)}>+</button>
            {isAddNoteOpen && (
                <AddNotePopup onClose={() => setIsAddNoteOpen(false)}/>
            )}
            {expandedNoteId && <div className="overlay" onClick={() => setExpandedNoteId(null)}/>}
        </div>
    );
};

export default Dashboard;