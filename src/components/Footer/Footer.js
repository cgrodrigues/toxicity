import React from 'react';
const Footer = props => {
    const { link } = props;
    return (
        <footer className="bg-light text-center text-lg-start">
            <div className="text-center p-3">
                The MIT License (MIT)
                <br></br>
                Copyright (&copy;) 2021 Phaser ML
                <br></br>
                <a className="text-dark" href={link}>{link}</a>
            </div>
        </footer>
    )
};
export default Footer
