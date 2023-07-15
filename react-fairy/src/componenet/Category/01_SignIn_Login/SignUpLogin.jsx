import React from 'react'
import SignUp from './SignUp'
import Login from './Login'
import SLOverlay from './SLOverlay'

import { useEffect, useRef, useState } from 'react';

import "../../../css/Hold/01_SignIn_Login/SLOverlay.css"
import "../../../css/Hold/01_SignIn_Login/Signup.css"
import "../../../css/Hold/01_SignIn_Login/Login.css"


const SignUpLogin = () => {



  return (
    <div className='SLBody' style={{backgroundColor:"green"}}>
        <h2 className='SLH2'>Weekly Coding Challenge #1: Sign in/up Form</h2>
        <ul className='container' id="container">
            <li class="form-container sign-up-container">
                <SignUp/>
            </li>
            <li class="form-container sign-in-container">
                <Login/>
            </li>
            <li className='overlay-container' >
                <SLOverlay />
            </li>
        </ul>
    </div>
  )
}

export default SignUpLogin