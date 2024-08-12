import React, { useState } from 'react';
import FriendsPopup from './FriendsPopup';

const FriendsButton = () => {
    const [isPopupOpen, setIsPopupOpen] = useState(false);

    return (
        <>
            <button className="friends-button" onClick={() => setIsPopupOpen(true)}>
                <img src="/friendsIcon.png" alt="Friends" className="friends-icon"/>
            </button>
            {isPopupOpen && <FriendsPopup onClose={() => setIsPopupOpen(false)} />}
        </>
    );
};

export default FriendsButton;