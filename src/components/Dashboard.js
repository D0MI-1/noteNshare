import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase/config';
import { collection, query, onSnapshot, orderBy , getDocs, getDoc, where, doc} from 'firebase/firestore';
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
            const notesQuery = query(
                collection(db, `users/${user.uid}/notes`),
                orderBy('lastEditedAt', sortOrder)
            );

            const unsubscribe = onSnapshot(notesQuery, (snapshot) => {
                const fetchedNotes = snapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        ...data,
                        isOwner: data.originalOwnerId === user.uid,
                        isShared: data.sharedWith && data.sharedWith.length > 0
                    };
                });
                console.log('Fetched notes:', fetchedNotes);
                setNotes(fetchedNotes);
            });

            return () => unsubscribe();
        }
    }, [sortOrder]);

    const handleNoteUpdate = (updatedNote) => {
        console.log('Updating note in Dashboard:', updatedNote);

        setNotes(prevNotes => prevNotes.map(note =>
            note.id === updatedNote.id ? { ...note, ...updatedNote } : note
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
                        key={`${note.id}-${note.isOwner ? 'own' : 'shared'}`}
                        note={{...note,
                            isShared: !note.isOwner
                        }}
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