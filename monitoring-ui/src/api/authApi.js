const BASE_URL = "http://localhost:5000";

export async function login(email, password) {
    try {
        // Send form data as required by OAuth2PasswordRequestForm
        const formData = new FormData();
        formData.append('username', email); // OAuth2 uses 'username' field for email
        formData.append('password', password);

        const res = await fetch(`${BASE_URL}/auth/login`, {
            method: "POST",
            body: formData
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({ detail: "Login failed" }));
            return { 
                success: false, 
                message: err.detail || err.message || "Login failed" 
            };
        }

        const data = await res.json();
        
        // Transform response to match expected format
        return {
            success: true,
            user: data.user,
            token: data.access_token
        };
    } catch (error) {
        // Don't show "Failed to fetch" - just return a generic error
        console.log("Login request:", { email, passwordLength: password?.length || 0 });
        return { 
            success: false, 
            message: "Unable to connect to server. Please check if the backend is running." 
        };
    }
}

export async function signup(email, password, faceImage) {
    try {
        // Extract base64 string from data URL if needed
        let faceImageBase64 = faceImage;
        if (faceImage && faceImage.startsWith('data:image')) {
            // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
            faceImageBase64 = faceImage.split(',')[1] || faceImage;
        }

        // Validate face image exists
        if (!faceImageBase64 || faceImageBase64.trim().length === 0) {
            return {
                success: false,
                message: "Face image is required"
            };
        }

        console.log("Signup request:", {
            email: email,
            passwordLength: password.length,
            faceImageLength: faceImageBase64.length,
            faceImagePreview: faceImageBase64.substring(0, 50) + "..."
        });

        const res = await fetch(`${BASE_URL}/auth/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: email,
                password: password,
                face_image: faceImageBase64
            })
        });

        if (!res.ok) {
            const err = await res.json();
            console.error("Signup error response:", err);
            return { 
                success: false, 
                message: err.detail || err.message || "Signup failed" 
            };
        }

        const data = await res.json();
        
        // Transform response to match expected format
        return {
            success: true,
            user: data.user,
            token: data.access_token
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

