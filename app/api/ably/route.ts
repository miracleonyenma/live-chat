// ./app/api/ably/route.ts

import { auth } from "@/auth"; // Authentication utility to validate user sessions.
import { SignJWT } from "jose"; // Library for creating JSON Web Tokens (JWT).
import { handleGetPermitUsers } from "@/utils/permit"; // Utility to fetch Permit.io users.
import permit from "@/lib/permit"; // Instance of Permit.io SDK.
import { RoleAssignmentRead } from "permitio"; // Type definition for Permit.io role assignments.

/**
 * Creates an Ably-compatible JWT token.
 * @param clientId - Unique identifier for the client (e.g., user's email).
 * @param apiKey - Ably API key consisting of app ID and signing key.
 * @param claim - User-specific claims (e.g., is the user a moderator?).
 * @param capability - Mapping of channels to permissions for the user.
 * @returns A signed JWT token.
 */
const createToken = (
  clientId: string,
  apiKey: string,
  claim: { isMod: boolean },
  capability: { [key: string]: string[] | undefined },
) => {
  // Extract the Ably app ID and signing key from the API key.
  const [appId, signingKey] = apiKey.split(":", 2);

  // Use TextEncoder to encode the signing key.
  const enc = new TextEncoder();

  // Create and sign a JWT with Ably-specific claims.
  return new SignJWT({
    "x-ably-capability": JSON.stringify(capability), // Specify channel permissions.
    "x-ably-clientId": clientId, // Associate the token with the client.
    "ably.channel.*": JSON.stringify(claim), // Include custom claims (e.g., moderator status).
  })
    .setProtectedHeader({ kid: appId, alg: "HS256" }) // Include app ID and algorithm.
    .setIssuedAt() // Set issued-at timestamp to now.
    .setExpirationTime("24h") // Set expiration to 24 hours.
    .sign(enc.encode(signingKey)); // Sign the token with the encoded key.
};

/**
 * Generates a permissions object based on the user's roles.
 * @param roles - Array of roles assigned to the user.
 * @returns An object mapping channel names to allowed actions.
 */
const generatePermissions = (roles: RoleAssignmentRead[]) => {
  // Define a mapping of roles to their respective permissions.
  const rolePermissions: Record<string, string[]> = {
    moderator: ["subscribe", "publish", "presence", "history"],
    participant: ["subscribe", "publish", "presence"],
    viewer: ["subscribe"],
  };

  // Transform the user's roles into a permissions object.
  return roles.reduce(
    (permissions, role) => {
      const resourceInstance = role.resource_instance?.split(":")[1]; // Extract channel name.
      const rolePerms = rolePermissions[role.role]; // Get permissions for the role.

      if (resourceInstance && rolePerms) {
        permissions[`chat:${resourceInstance}`] = rolePerms; // Map permissions to the channel.
      }

      return permissions;
    },
    {} as Record<string, string[]>,
  );
};

/**
 * API handler for generating an Ably token for the authenticated user.
 * @returns A JSON response containing the Ably token or an empty string.
 */
export const GET = async () => {
  // Authenticate the user and retrieve their session data.
  const session = await auth();
  const user = session?.user;

  // Fetch all users from Permit.io and locate the current user by email.
  const permitUsers = await handleGetPermitUsers();
  const permitUser = permitUsers.data.find(
    (permitUser) => permitUser.email === user?.email,
  );

  // Retrieve the roles assigned to the user from Permit.io.
  const userAssignedRoles = await permit.api.getAssignedRoles(
    permitUser?.id as string,
  );

  // Generate channel permissions based on the user's roles.
  const permissions = generatePermissions(userAssignedRoles);

  // Determine if the user has moderator privileges.
  const userClaim = {
    isMod: !!userAssignedRoles.find(
      (role) => role.resource_instance === "channel:mod",
    ),
  };

  // Define the user's channel capabilities. Moderators have full access.
  const userCapability = userClaim.isMod ? { "*": ["*"] } : permissions;

  // Generate a signed JWT token for the authenticated user.
  const token =
    user?.email &&
    (await createToken(
      user.email, // Use the user's email as the client ID.
      process.env.ABLY_SECRET_KEY as string, // Retrieve the Ably secret key from environment variables.
      userClaim, // Pass the user's role claims.
      userCapability, // Include the generated channel permissions.
    ));

  // Return the token or an empty string if token generation fails.
  return Response.json(token || "");
};
