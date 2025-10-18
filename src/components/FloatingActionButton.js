import React from 'react';
import './FloatingActionButton.css';

const FloatingActionButton = ({ onClick }) => {
    return (
        <button className="fab" onClick={onClick}>
            +
        </button>
    );
};

export default FloatingActionButton;