/* ============================================================================
   NEON ARCADE — 3D Controller in C++ (Raylib Edition)
   ============================================================================
   Description:
     A complete, standalone 3D interactive gaming controller program written
     in C++ using the raylib graphics library. It features procedural 3D
     modeling, dynamic lighting, real-time mouse-controlled tilting, and
     simple harmonic motion (floating sine wave).

   How to Run Natively (Windows):
     1. Install MinGW-w64 (g++) and download raylib (https://www.raylib.com).
     2. Compile using:
        g++ controller.cpp -lraylib -lopengl32 -lgdi32 -lwinmm
     3. Run the resulting executable.

   How to Compile to the Web (WebAssembly via Emscripten):
     1. Install Emscripten SDK (emsdk).
     2. Compile using:
        emcc -o controller.html controller.cpp -lraylib -s USE_GLFW=3 -s ASYNCIFY
     3. Open the compiled controller.html in a browser.
   ============================================================================ */

#include "raylib.h"
#include <math.h>

// Screen dimensions (matching the arcade hub UI placeholder)
const int screenWidth = 620;
const int screenHeight = 500;

int main(void)
{
    // Enable 4x Multisample Anti-Aliasing (MSAA) for smooth edges
    SetConfigFlags(FLAG_MSAA_4X_HINT | FLAG_WINDOW_TRANSPARENT);
    InitWindow(screenWidth, screenHeight, "Arcade Hub — 3D C++ Controller");

    // ── 3D CAMERA SETUP ─────────────────────────────────────────────────────
    // Set up camera looking down the Z axis
    Camera3D camera = { 0 };
    camera.position = (Vector3){ 0.0f, 0.8f, 7.5f }; // Position camera at (0, 0.8, 7.5)
    camera.target = (Vector3){ 0.0f, 0.0f, 0.0f };      // Camera points at world origin
    camera.up = (Vector3){ 0.0f, 1.0f, 0.0f };          // Y-axis is up
    camera.fovy = 35.0f;                                // 35 degree vertical Field of View (reduces distortion)
    camera.projection = CAMERA_PERSPECTIVE;             // Perspective projection

    // ── ROTATION & MOTION VARIABLES ─────────────────────────────────────────
    Vector2 mousePos = { 0.0f, 0.0f };
    float targetRotX = 0.0f;
    float targetRotY = 0.0f;
    float currentRotX = 0.0f;
    float currentRotY = 0.0f;
    
    // Animation clock / frame counter
    unsigned int clock = 0;

    SetTargetFPS(60); // Limit refresh rate to 60 FPS for consistent game speed

    // Main window loop
    while (!WindowShouldClose())
    {
        clock++;

        // ── 1. MOUSE INPUT & NORMALIZATION ──────────────────────────────────
        mousePos = GetMousePosition();
        
        // Map mouse screen pixels to normalized coordinates: -1.0 to +1.0
        // (0, 0) is the center of the viewport
        float nx = (mousePos.x / (float)screenWidth) * 2.0f - 1.0f;
        float ny = (mousePos.y / (float)screenHeight) * 2.0f - 1.0f;

        // ── 2. MATHEMATICAL PHYSICS CALCULATION ─────────────────────────────
        // Target tilt angles (maximum pitch/roll limit)
        targetRotY = nx * 0.45f;   // Roll tilt (Y rotation)
        targetRotX = -ny * 0.28f;  // Pitch tilt (X rotation)

        // Linear Interpolation (LERP) for smooth movement:
        // current = current + (target - current) * 0.05 (5% movement per frame)
        currentRotX += (targetRotX - currentRotX) * 0.05f;
        currentRotY += (targetRotY - currentRotY) * 0.05f;

        // Floating motion using a Sine Wave (Simple Harmonic Motion):
        // Position oscillates periodically between -0.22 and +0.22 units
        float floatY = sinf(clock * 0.015f) * 0.22f;

        // Slow continuous idle rotation on Y axis (constant angular velocity)
        float idleRotY = clock * 0.003f;

        // ── 3. RENDER DRAWING LOOP ──────────────────────────────────────────
        BeginDrawing();

            // Clear frame buffer with a transparent color so the web background remains visible
            ClearBackground(BLANK);

            BeginMode3D(camera);

                // Start 3D Model transformation matrix
                // We use standard OpenGL matrix stacks to rotate and scale the model
                rlPushMatrix();

                    // A. Float translation (bobbing up/down)
                    rlTranslatef(0.0f, floatY, 0.0f);

                    // B. Idle continuous spin + mouse horizontal tilt
                    rlRotatef((idleRotY + currentRotY) * RAD2DEG, 0.0f, 1.0f, 0.0f);

                    // C. Face forward angle (18 degrees tilt) + mouse vertical tilt
                    rlRotatef((0.314f + currentRotX) * RAD2DEG, 1.0f, 0.0f, 0.0f);

                    // D. Wobble around Z-axis for natural weight representation
                    rlRotatef(sinf(clock * 0.008f) * 1.5f, 0.0f, 0.0f, 1.0f);

                    // Scale factor for 3D model
                    rlScalef(1.1f, 1.1f, 1.1f);

                    // ── 3D MODEL ASSEMBLY (Primitives) ──────────────────────
                    // Main Body: Warm Charcoal color (#1A100C -> RGB 26, 16, 12)
                    DrawCube((Vector3){ 0.0f, 0.0f, 0.0f }, 2.8f, 1.1f, 0.5f, (Color){ 26, 16, 12, 255 });
                    
                    // Grips (Tapered cylinders/capsules for grip ergonomics)
                    DrawCylinderEx((Vector3){ -1.0f, -0.6f, 0.0f }, (Vector3){ -1.3f, -1.5f, 0.0f }, 0.5f, 0.35f, 16, (Color){ 21, 12, 8, 255 });
                    DrawCylinderEx((Vector3){ 1.0f, -0.6f, 0.0f }, (Vector3){ 1.3f, -1.5f, 0.0f }, 0.5f, 0.35f, 16, (Color){ 21, 12, 8, 255 });

                    // Decorative top shoulder bumper lines
                    DrawCube((Vector3){ -1.0f, 0.55f, 0.0f }, 0.9f, 0.15f, 0.45f, (Color){ 42, 26, 20, 255 });
                    DrawCube((Vector3){ 1.0f, 0.55f, 0.0f }, 0.9f, 0.15f, 0.45f, (Color){ 42, 26, 20, 255 });

                    // Center Touchpad (Steel Blue tone)
                    DrawCube((Vector3){ 0.0f, 0.15f, 0.26f }, 0.7f, 0.5f, 0.06f, (Color){ 37, 32, 56, 255 });

                    // D-Pad Cross (Cream colored)
                    DrawCube((Vector3){ -0.85f, 0.1f, 0.3f }, 0.55f, 0.18f, 0.12f, (Color){ 255, 235, 211, 255 });
                    DrawCube((Vector3){ -0.85f, 0.1f, 0.3f }, 0.18f, 0.55f, 0.12f, (Color){ 255, 235, 211, 255 });

                    // ABXY Diamond Buttons (Sphere primitives with colored highlights)
                    DrawSphere((Vector3){ 0.85f,  0.30f, 0.32f }, 0.09f, (Color){ 255, 235, 211, 255 }); // Y - cream
                    DrawSphere((Vector3){ 1.05f,  0.10f, 0.32f }, 0.09f, (Color){ 103, 162, 197, 255 }); // B - blue
                    DrawSphere((Vector3){ 0.85f, -0.10f, 0.32f }, 0.09f, (Color){ 255, 182, 166, 255 }); // A - peach
                    DrawSphere((Vector3){ 0.65f,  0.10f, 0.32f }, 0.09f, (Color){ 123, 203, 154, 255 }); // X - green

                    // Left Stick Base and Cap
                    DrawCylinder((Vector3){ -0.45f, -0.12f, 0.28f }, 0.15f, 0.15f, 0.06f, 16, (Color){ 42, 32, 64, 255 });
                    DrawSphere((Vector3){ -0.45f, -0.12f, 0.32f }, 0.12f, (Color){ 58, 48, 78, 255 });
                    
                    // Right Stick Base and Cap
                    DrawCylinder((Vector3){ 0.45f, -0.12f, 0.28f }, 0.15f, 0.15f, 0.06f, 16, (Color){ 42, 32, 64, 255 });
                    DrawSphere((Vector3){ 0.45f, -0.12f, 0.32f }, 0.12f, (Color){ 58, 48, 78, 255 });

                    // Glowing LED accent ring around touchpad (Visual cue matching HTML colors)
                    DrawCircle3D((Vector3){ 0.0f, 0.15f, 0.29f }, 0.42f, (Vector3){ 0.0f, 0.0f, 1.0f }, 0.0f, (Color){ 103, 162, 197, 180 });

                rlPopMatrix();

            EndMode3D();

            // Render stats inside the preview frame (debug / presentation help)
            DrawText("LANG: C++ (OpenGL)", 12, 12, 10, (Color){ 255, 182, 166, 180 });
            DrawText(FormatText("FPS: %i", GetFPS()), 12, 26, 10, (Color){ 255, 235, 211, 180 });

        EndDrawing();
    }

    // De-initialize OpenGL context and close native window
    CloseWindow();

    return 0;
}
