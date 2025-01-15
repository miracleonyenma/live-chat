// ./auth.ts

// Import NextAuth for authentication and session management
import NextAuth from "next-auth";

// Import the Google provider for authentication via Google accounts
import Google from "next-auth/providers/google";

// Import utility functions for Permit.io integration
import { handleListResourceInstances, handleSyncUser } from "./utils/permit";

// Export handlers and authentication functions provided by NextAuth
export const { handlers, signIn, signOut, auth } = NextAuth({
  // Define the list of authentication providers (Google in this case)
  providers: [Google],

  // Define custom callback functions for NextAuth
  callbacks: {
    // Custom sign-in callback function
    async signIn(params) {
      // Log the sign-in parameters for debugging
      // console.log("🟢🟢🟢🟢🟢 ~ params", params);

      // Fetch the list of resource instances using the Permit.io utility
      const resourceInstances = await handleListResourceInstances();

      // Find the specific resource instance with the key "general"
      const resourceInstance = resourceInstances.find(
        (resourceInstance) => resourceInstance.key === "general",
      );

      // Log the fetched resource instance for debugging
      // console.log("🟢🟢🟢🟢🟢 ~ resourceInstance", resourceInstance);

      // Sync the authenticated user's data with Permit.io, assigning them a role and associating them with the resource instance
      handleSyncUser({
        user: {
          id: params.user.email as string, // User's email
          email: params.user.email as string, // User's email
          first_name: params.profile?.given_name as string, // User's first name
          last_name: params.profile?.family_name as string, // User's last name
        },
        role: "participant", // Assign the role of "participant" to the user
        resource_instance: resourceInstance?.id as string, // Associate the user with the "general" resource instance
      });

      // Allow the sign-in process to proceed
      return true;
    },
  },
});
