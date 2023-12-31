import React, { useEffect, useRef, useState } from 'react';
import SignUp from './SignUp';
import Login from './Login';

import "../../../css/Hold/01_SignIn_Login/SLOverlay.css";
import "../../../css/Hold/01_SignIn_Login/Signup.css";


const SignUpLogin = () => {

    // ref = DOM요소에 접근하는 방법 
    let overlayRef = useRef()
    let containerRef = useRef()

    // state 변수와 똑같은 역할 (다만, 화면에서 바로 변해야하는 친구들을 관리)
    // const [변수이름, set변수이름] 
    // num = 3; 
    // setNum(3)

    let activePanel = useState(true)

    const signIn = () => {
        containerRef.current.classList.remove("right-panel-active")

    }

    const signUp = () => {
        containerRef.current.classList.add("right-panel-active")
    }



    // js 구조 

    return (
        <div className='SLBody' >
            <h2 className='SLH2' ></h2><h1 style={{textAlign:"center"}}><stron></stron> </h1>
            <ul className='container' id="container" ref={containerRef}>
                <li className="form-container sign-up-container">
                    <SignUp />
                </li>
                <li className="form-container sign-in-container">
                    <Login />
                </li>

                <li className='overlay-container' >
                    <div className="overlay" ref={overlayRef}>
                        <div className={`overlay-panel overlay-left ${activePanel === 'sign-in' ? 'active' : ''}`}>
                            <h1>Hello, Friend!</h1>
                            <p>To keep connected with us, please login with your personal info.</p>
                            <button className="ghost" id="signIn" 
                            style={{
                                padding:"10px",
                                backgroundColor: "transparent",
                                borderColor:"#ffffff",
                                marginTop:"10px",
                                borderRadius:"15px",
                                color:"#fff",
                                
                                
                            }}
                            onClick={signIn}>Sign Up</button>
                        </div>


                        <div className={`overlay-panel overlay-right ${activePanel === 'sign-up' ? 'active' : ''}`}>
                            <h1>Welcome!</h1>
                            <p>Enter your personal details and start your journey with us.</p>
                            <button className="ghost" id="signUp" 
                                style={{
                                    padding:"10px",
                                    backgroundColor: "transparent",
                                    borderColor:"#ffffff",
                                    marginTop:"10px",
                                    borderRadius:"15px",
                                    color:"#fff"
                                }}
                            onClick={signUp}>Sign In</button>
                        </div>
                    </div>
                </li>
            </ul>
        </div>
    );
}

export default SignUpLogin;
{/* 

<li className='overlay-container' style={{ display: "none" }}>
<div className="overlay" ref={overlayRef}>
<div className={`overlay-panel overlay-left ${activePanel === 'sign-in' ? 'active' : ''}`}>
<h1>Welcome Back!</h1>
<p>To keep connected with us, please login with your personal info.</p>
<button className="ghost" id="signIn">Sign In</button>
</div>
<div className={`overlay-panel overlay-right ${activePanel === 'sign-up' ? 'active' : ''}`}>
<h1>Hello, Friend!</h1>
<p>Enter your personal details and start your journey with us.</p>
<button className="ghost" id="signUp">Sign Up</button>

</li>
</div>
</div>



// const overlayRef = useRef(null);
// const [activePanel, setActivePanel] = useState('sign-in');

// useEffect(() => {
//     const overlay = overlayRef.current;

//     const handleSignUpClick = () => {
//         setActivePanel('sign-up');
//     };

//     const handleSignInClick = () => {
//         setActivePanel('sign-in');
//     };

//     const signUpButton = overlay.querySelector('.overlay-panel.overlay-right #signUp');
//     const signInButton = overlay.querySelector('.overlay-panel.overlay-left #signIn');


//     if (signUpButton && signInButton) {
//         signUpButton.addEventListener('click', handleSignUpClick);
//         signInButton.addEventListener('click', handleSignInClick);
//     }

//     return () => {
//         if (signUpButton && signInButton) {
//             signUpButton.removeEventListener('click', handleSignUpClick);
//             signInButton.removeEventListener('click', handleSignInClick);
//         }
//     };
// }, []);
</li> */}