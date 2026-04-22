import React, { useEffect } from "react";
import { useState } from "react";
import { CgProfile } from "react-icons/cg";
import { Link } from "react-router"; 
import Login from "./Login";
import "./Header.css";




const Header = ()=>{
    const[isOpen,setIsOpen]=useState(false);
    let token=localStorage.getItem("token")
    const [isLogin,setIsLogin]=useState(token ? false : true)

    useEffect(()=>{
        setIsLogin(token ? false : true)
    },[token])

    const checkLogin=()=>{
        if(token){
            localStorage.removeItem("token")
            localStorage.removeItem("user")
            setIsLogin(true)
        }
        else setIsOpen(true)
    }

    return(
        <>
            <header>
                
                <img className="logo" src="../public/assets/logo_img.png" alt="image-logo" />
                <nav>
                    <Link className="link" to="/">Home</Link>
                    <Link className="link" to={!isLogin ? "/addrecipe" : "/"}>Create</Link>
                    <Link className="link" to="/favorites">Favorites</Link>
                    <Link className="link" to="/profile">Profile</Link>
                    
                    {/* <Link to="/login" onClick={checkLogin}>Login</Link> */}
                    
                    <p className="link" onClick={checkLogin}>{(isLogin)? "Login" : "Logout"}</p>
                    {/* <Link className="profile" to="/profile"><CgProfile /></Link> */}

                    

                </nav>

            </header>
            { (isOpen) && <Login onClose={ ()=>setIsOpen(false) }/>}
        </>
    )
}
export default Header;
