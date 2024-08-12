import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase/config';
import { doc, updateDoc, deleteDoc, collection, query, where, getDocs , arrayRemove, writeBatch, serverTimestamp } from 'firebase/firestore';

const NoteCard = ({ note , onUpdate, onDelete}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedTitle, setEditedTitle] = useState(note.title);
    const [editedContent, setEditedContent] = useState(note.content);
    //const [sharingWith, setSharingWith] = useState('');
    const [friends, setFriends] = useState([]);
    const [selectedFriends, setSelectedFriends] = useState([]);

    useEffect(() => {
        // Update local state when note changes
        setEditedTitle(note.title);
        setEditedContent(note.content);
    }, [note]);

    useEffect(() => {
        const fetchFriends = async () => {
            const user = auth.currentUser;
            if (user) {
                const q = query(collection(db, `users/${user.uid}/friends`), where("status", "==", "accepted"));
                const querySnapshot = await getDocs(q);
                setFriends(querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    userId: doc.data().userId,
                    email: doc.data().email
                })));
            }
        };
        fetchFriends();
    }, []);

    const handleExpand = () => {
        if (!isExpanded) {
            setIsExpanded(!isExpanded);
        }
    };

    const handleClose = (e) => {
        e.stopPropagation();
        setIsExpanded(false);
        setIsEditing(false);
    };


    const handleEdit = async (e) => {

        e.stopPropagation();
        if (isEditing) {
            try {
                const batch = writeBatch(db);
                const updatedNote = {
                    ...note,
                    title: editedTitle,
                    content: editedContent,
                    lastEditedAt: serverTimestamp(),
                };

                // Update the original note
                const originalNoteRef = doc(db, `users/${note.originalOwnerId || auth.currentUser.uid}/notes`, note.originalNoteId || note.id);
                batch.update(originalNoteRef, updatedNote);

                // If this is a shared note, update all shared copies
                if (note.sharedWith && note.sharedWith.length > 0) {
                    for (const userId of note.sharedWith) {
                        const sharedNoteRef = doc(db, `users/${userId}/notes`, note.id);
                        batch.update(sharedNoteRef, updatedNote);
                    }
                }

                await batch.commit();
                setIsEditing(false);
                onUpdate(updatedNote);
                console.log('Updated note:', updatedNote);

            } catch (error) {
                console.error("Error updating note:", error);
                alert("Failed to update note. Please try again.");
            }
        } else {
            setIsEditing(true);
        }
    };

    const handleDelete = async (e) => {
        e.stopPropagation();
        if (window.confirm("Are you sure you want to delete this note?")) {
            try {
                if (note.isOwner) {
                    // Delete the note and all shared instances
                    const batch = writeBatch(db);
                    batch.delete(doc(db, `users/${auth.currentUser.uid}/notes`, note.id));

                    if (note.sharedWith && note.sharedWith.length > 0) {
                        for (const userId of note.sharedWith) {
                            const sharedNoteRef = doc(db, `users/${userId}/notes`, note.id);
                            batch.delete(sharedNoteRef);
                        }
                    }

                    await batch.commit();
                } else {
                    // Remove the shared note from the current user's collection
                    await deleteDoc(doc(db, `users/${auth.currentUser.uid}/notes`, note.id));

                    // Remove the current user from the sharedWith array of the original note
                    const originalNoteRef = doc(db, `users/${note.originalOwnerId}/notes`, note.originalNoteId);
                    await updateDoc(originalNoteRef, {
                        sharedWith: arrayRemove(auth.currentUser.uid)
                    });
                }
                onDelete(note.id);
            } catch (error) {
                console.error("Error deleting note:", error);
                alert("Failed to delete note. Please try again.");
            }
        }
    };

    const handleInputClick = (e) => {
        e.stopPropagation(); // Prevent the note from collapsing when clicking input fields
    };

    const handleShare = async (e) => {
        e.stopPropagation();
        const user = auth.currentUser;
        if (user && selectedFriends.length > 0) {
            try {
                const batch = writeBatch(db);

                const updatedNote = {
                    ...note,
                    sharedWith: [...new Set([...(note.sharedWith || []), ...selectedFriends.map(friend => friend.userId)])],
                    isShared: true
                };

                // Update the original note
                const originalNoteRef = doc(db, `users/${user.uid}/notes`, note.id);
                batch.update(originalNoteRef, updatedNote);

                // Add the note to each friend's notes collection
                for (const friend of selectedFriends) {
                    const friendNoteRef = doc(db, `users/${friend.userId}/notes`, note.id);
                    const sharedNoteData = {
                        ...updatedNote,
                        originalNoteId: note.id,
                        originalOwnerId: user.uid,
                        sharedAt: serverTimestamp(),
                        isOwner: false
                    };
                    batch.set(friendNoteRef, sharedNoteData);
                }

                await batch.commit();
                alert(`Note shared with ${selectedFriends.length} friend(s)`);
                setSelectedFriends([]);
                onUpdate(updatedNote);
                console.log('Updated note:', updatedNote);
            } catch (error) {
                console.error("Error sharing note:", error);
                alert("Failed to share note. Please try again.");
            }
        }
    };

    const contentPreview = note.content.split('\n').slice(0, 2).join('\n');

    return (
        <div
            className={`note-card ${isExpanded ? 'expanded' : ''} ${note.isShared || note.sharedWith?.length > 0 ? 'shared' : ''}`}
            style={{ backgroundColor: note.color }}
            onClick={handleExpand}
        >
            {(note.isShared || note.sharedWith?.length > 0) && <div className="shared-indicator">Shared</div>}

            {isExpanded && (
                <button className="close-button" onClick={handleClose}>×</button>
            )}

            {isEditing ? (
                <>
                    <input
                        value={editedTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                        onClick={handleInputClick}
                    />
                    <textarea
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        onClick={handleInputClick}
                    />
                </>
            ) : (
                <>
                    <h3>{note.title}</h3>
                    <p>{isExpanded ? note.content : contentPreview}</p>
                </>
            )}

            {isExpanded && (
                <div className="note-actions">
                    <button onClick={handleEdit}>{isEditing ? 'Save' : 'Edit'}</button>
                    <button onClick={handleDelete}>Delete</button>
                    <select
                        multiple
                        value={selectedFriends.map(friend => friend.id)}
                        onChange={(e) => {
                            const selectedIds = Array.from(e.target.selectedOptions, option => option.value);
                            const selectedFriendsData = friends.filter(friend => selectedIds.includes(friend.id));
                            setSelectedFriends(selectedFriendsData);
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {friends.map(friend => (
                            <option key={friend.id} value={friend.id}>{friend.email}</option>
                        ))}
                    </select>
                    <button onClick={handleShare}>Share</button>
                </div>
            )}
        </div>
    );
};

export default NoteCard;