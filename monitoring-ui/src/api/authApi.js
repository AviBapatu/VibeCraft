const BASE_URL = "http://localhost:5000";

// For now, we'll use mock authentication
// In production, this would connect to your backend auth endpoints
export async function login(email, password) {
    try {
        // Mock API call - replace with actual endpoint
        // const res = await fetch(`${BASE_URL}/auth/login`, {
        //     method: "POST",
        //     headers: { "Content-Type": "application/json" },
        //     body: JSON.stringify({ email, password })
        // });
        // if (!res.ok) {
        //     const err = await res.json();
        //     throw new Error(err.message || "Login failed");
        // }
        // return res.json();

        // Mock response for now
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
        
        // Simple validation
        if (!email || !password) {
            return { success: false, message: "Email and password are required" };
        }

        if (password.length < 6) {
            return { success: false, message: "Password must be at least 6 characters" };
        }

        // Mock successful login
        return {
            success: true,
            user: {
                id: "1",
                email: email,
                name: email.split("@")[0]
            },
            token: "mock_jwt_token_" + Date.now()
        };
    } catch (error) {
        console.error("Login error:", error);
        return { success: false, message: error.message || "Login failed" };
    }
}

export async function signup(email, password, faceImage) {
    try {
        // Mock API call - replace with actual endpoint
        // const formData = new FormData();
        // formData.append('email', email);
        // formData.append('password', password);
        // if (faceImage) {
        //     const blob = await fetch(faceImage).then(r => r.blob());
        //     formData.append('face_image', blob, 'face.jpg');
        // }
        // const res = await fetch(`${BASE_URL}/auth/signup`, {
        //     method: "POST",
        //     body: formData
        // });
        // if (!res.ok) {
        //     const err = await res.json();
        //     throw new Error(err.message || "Signup failed");
        // }
        // return res.json();

        // Mock response for now
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API delay
        
        // Simple validation
        if (!email || !password) {
            return { success: false, message: "Email and password are required" };
        }

        if (password.length < 6) {
            return { success: false, message: "Password must be at least 6 characters" };
        }

        if (!faceImage) {
            return { success: false, message: "Face image is required for verification" };
        }

        // Mock successful signup with face image
        console.log("Face image captured:", faceImage.substring(0, 50) + "...");
        
        return {
            success: true,
            user: {
                id: "1",
                email: email,
                name: email.split("@")[0],
                faceImage: faceImage // Store face image in user object
            },
            token: "mock_jwt_token_" + Date.now()
        };
    } catch (error) {
        console.error("Signup error:", error);
        return { success: false, message: error.message || "Signup failed" };
    }
}

export async function logout(token) {
    try {
        // Mock API call - replace with actual endpoint
        // const res = await fetch(`${BASE_URL}/auth/logout`, {
        //     method: "POST",
        //     headers: {
        //         "Content-Type": "application/json",
        //         "Authorization": `Bearer ${token}`
        //     }
        // });
        // return res.ok;
        
        // For mock, just return success
        return true;
    } catch (error) {
        console.error("Logout error:", error);
        return false;
    }
}

