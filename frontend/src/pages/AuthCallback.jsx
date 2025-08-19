import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { handleGoogleCallback } from "../utils/auth";

const AuthCallback = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const processCallback = async () => {
      try {
        // console.log("window.location.search:", window.location.search);
        // const urlParams = new URLSearchParams(window.location.search);
        // for (const [key, value] of urlParams.entries()) {
        //   console.log(`Param: ${key} = ${value}`);
        // }
        const token = handleGoogleCallback();
        // console.log("Token from handleGoogleCallback:", token);
        if (token) {
          await new Promise((resolve) => setTimeout(resolve, 300));
          await login();
          navigate("/dashboard");
        } else {
          throw new Error("No token received");
        }
      } catch (error) {
        // console.error("Auth callback error:", error);
        navigate("/login?error=" + encodeURIComponent(error.message));
      }
    };
    processCallback();
  }, [navigate, login]);


  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        flexDirection: "column",
      }}
    >
      <div>Processing authentication...</div>
      <div style={{ marginTop: "20px" }}>Please wait...</div>
    </div>
  );
};

export default AuthCallback;
