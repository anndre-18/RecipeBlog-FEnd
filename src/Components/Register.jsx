import React from "react";

 const Register = ()=>{
    return (
        <>
            <div className="wrapper">    
              <div className="form-box-register">
                <form action="" className='loginform'>
        
                  <h1 className="title">Registration</h1>
        
                  <div className="formgroup">
                    
                    <input type="text" id='uname' placeholder='Username'/>
                    <FaUser  className='icon' />
                  </div>
                  
                  <div className="formgroup">
                    
                    <input type="password" id='password' placeholder='Password' />
                    <FaLock className='icon' />
                  </div>
        
                  <div className="forgotpass">
                    <a href="/">Forgot password?</a>
                  </div>
        
                  <div className="submitlogin">
                    <button type="submit" className='submitlogin-btn'>Register</button>
                  </div>
        
                  <div className="register-link">
                    <p>Already a user? <a href="login">Login</a></p>
                  </div>
        
                </form>
        
              </div> 
              
            </div>         
        </>
    )

 }
 export default Register