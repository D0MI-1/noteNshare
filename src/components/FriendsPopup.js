import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase/config';
import { collection, query, onSnapshot, addDoc, updateDoc, doc, where, getDocs , getDoc } from 'firebase/firestore';

const FriendsPopup = ({ onClose }) => {
    const [friends, setFriends] = useState([]);
    const [newFriendEmail, setNewFriendEmail] = useState('');

    useEffect(() => {
        const user = auth.currentUser;
        if (user) {
            const q = query(collection(db, `users/${user.uid}/friends`));
            const unsubscribe = onSnapshot(q, (querySnapshot) => {
                const friendsData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setFriends(friendsData);
            });
            return () => unsubscribe();
        }
    }, []);

    const addFriend = async () => {
        const user = auth.currentUser;
        if (!user) {
            console.log('No user is signed in');
            alert('You must be signed in to add a friend.');
            return;
        }

        if (user.email === newFriendEmail) {
            alert("You can't add yourself as a friend.");
            return;
        }

        if (newFriendEmail) {
            try {
                // Check if user exists
                console.log('Checking if user exists...');

                const userQuery = query(collection(db, 'users'), where('email', '==', newFriendEmail));
                const userSnapshot = await getDocs(userQuery);

                if (userSnapshot.empty) {
                    console.log('No user found with this email.');
                    alert('No user found with this email.');
                    return;
                }

                console.log('User found, checking if already friends...');
                const friendUser = userSnapshot.docs[0];

                // Check if already friends
                const friendCheckQuery = query(collection(db, `users/${user.uid}/friends`), where('email', '==', newFriendEmail));
                const friendCheckSnapshot = await getDocs(friendCheckQuery);

                if (!friendCheckSnapshot.empty) {
                    console.log('Already friends or pending request.');
                    alert('You are already friends with this user or have a pending request.');
                    return;
                }

                // Add friend
                console.log('Adding friend to current user\'s list...');
                await addDoc(collection(db, `users/${user.uid}/friends`), {
                    email: newFriendEmail,
                    status: 'pending',
                    userId: friendUser.id
                });

                // Add reverse friend request
                console.log('Adding reverse friend request...');
                await addDoc(collection(db, `users/${friendUser.id}/friends`), {
                    email: user.email,
                    status: 'incoming',
                    userId: user.uid
                });

                console.log('Friend added successfully!');
                setNewFriendEmail('');
            } catch (error) {
                console.error("Error adding friend:", error);
                console.error("Error details:", error.code, error.message);
                alert(`Failed to add friend. Error: ${error.message}`);
            }
        }
    };

    const acceptFriendRequest = async (friendId, friendUserId) => {
        const user = auth.currentUser;
        if (!user) {
            console.error('No user is signed in');
            alert('You must be signed in to accept friend requests.');
            return;
        }

        try {
            console.log('Starting friend request acceptance process...');
            console.log('Current user ID:', user.uid);
            console.log('Friend ID to accept:', friendId);
            console.log('Friend User ID:', friendUserId);

            // Step 1: Verify current user's friend document
            const currentUserFriendRef = doc(db, `users/${user.uid}/friends`, friendId);
            const currentUserFriendDoc = await getDoc(currentUserFriendRef);

            if (!currentUserFriendDoc.exists()) {
                throw new Error('Current user\'s friend document not found');
            }

            console.log('Current user\'s friend document data:', currentUserFriendDoc.data());

            // Step 2: Update current user's friend document
            try {
                await updateDoc(currentUserFriendRef, { status: 'accepted' });
                console.log('Updated current user\'s friend document successfully');
            } catch (error) {
                console.error('Error updating current user\'s friend document:', error);
                throw error;
            }

            // Step 3: Find other user's friend document
            const otherUserFriendQuery = query(
                collection(db, `users/${friendUserId}/friends`),
                where('userId', '==', user.uid)
            );
            const otherUserFriendSnapshot = await getDocs(otherUserFriendQuery);

            if (otherUserFriendSnapshot.empty) {
                throw new Error('Other user\'s friend document not found');
            }

            const otherUserFriendDoc = otherUserFriendSnapshot.docs[0];
            console.log('Other user\'s friend document data:', otherUserFriendDoc.data());

            // Step 4: Update other user's friend document
            const otherUserFriendRef = doc(db, `users/${friendUserId}/friends`, otherUserFriendDoc.id);
            try {
                await updateDoc(otherUserFriendRef, { status: 'accepted' });
                console.log('Updated other user\'s friend document successfully');
            } catch (error) {
                console.error('Error updating other user\'s friend document:', error);
                throw error;
            }

            console.log('Friend request accepted successfully');
            alert('Friend request accepted successfully');

        } catch (error) {
            console.error("Error accepting friend request:", error);
            if (error.code === 'permission-denied') {
                alert('Permission denied. Please check your account permissions and try again.');
            } else {
                alert(`Failed to accept friend request. Error: ${error.message}`);
            }
        }
    };


    return (
        <div className="friends-popup">
            <h2>Friends</h2>
            <input
                type="email"
                value={newFriendEmail}
                onChange={(e) => setNewFriendEmail(e.target.value)}
                placeholder="Add friend by email"
            />
            <button onClick={addFriend}>Add Friend</button>
            <ul>
                {friends.map(friend => (
                    <li key={friend.id}>
                        {friend.email} - {friend.status}
                        {friend.status === 'incoming' && (
                            <button onClick={() => acceptFriendRequest(friend.id, friend.userId)}>Accept</button>
                        )}
                    </li>
                ))}
            </ul>
            <button onClick={onClose}>Close</button>
        </div>
    );
};

export default FriendsPopup;