import React, { useState } from "react";
import { useNavigate } from "react-router";
import { FaLock, FaUser } from "react-icons/fa";
import "./login-register.css";
import axios from "axios";

const Login = ({ onClose }) => {
  const [uname, setUname] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    let endpoint = isRegister ? "api/register" : "api/login";

    try {
      //  const res = await axios.post(`http://localhost:3000/${endpoint}`, {
        const res = await axios.post(`https://recipeblog-bend.onrender.com/${endpoint}`, {
        uname,
        password,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      console.log("Response:", res);

      if (res.data.token) {
        onClose();  // Close the popup
        navigate("/"); // Redirect to home page
      } else {
        alert(res.data.message || "Invalid credentials!");
      }
    } catch (error) {
      setError(error.response?.data?.error || "Something went wrong!");
    }
  };

  return (
    <>
      <div className="wrapper">
        <dialog className="model" open>
          <div className="form-box-login">
            <form className="loginform" name="form" onSubmit={handleSubmit}>
              <h1 className="l-title">
                {isRegister ? "Register" : "Login"}
              </h1>

              <div className="formgroup">
                <input
                  type="text"
                  id="uname"
                  placeholder="Username"
                  value={uname}
                  onChange={(e) => setUname(e.target.value)}
                  required
                />
                <FaUser className="icon" />
              </div>

              <div className="formgroup">
                <input
                  type="password"
                  id="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <FaLock className="icon" />
              </div>

              <div className="forgotpass">
                <a href="/">Forgot password?</a>
              </div>

              <div className="submitlogin">
                <button type="submit" className="submitlogin-btn">
                  {isRegister ? "Register" : "Login"}
                </button>
              </div>

              {error && <p className="error-message">{error}</p>}

              <div className="register-link">
                <p>
                  {isRegister ? "Already a user?" : "Don't have an account?"}{" "}
                  <span onClick={() => setIsRegister((prev) => !prev)}>
                    {isRegister ? "Login" : "Register"}
                  </span>
                </p>
              </div>
            </form>
          </div>
        </dialog>
      </div>
    </>
  );
};

export default Login;
