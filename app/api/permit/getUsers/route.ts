// ./app/api/permit/getUsers/route.ts
import permit from "@/lib/permit"; // Importing the Permit.io instance from the specified library path.
import { getUserRoles } from "@/utils/permit";

// Exported GET handler function for fetching all users and their roles.
export const GET = async () => {
  try {
    // Fetch the list of users using the Permit.io API.
    const res = await permit.api.users.list();

    // Map over the users and fetch their roles asynchronously.
    const users = await Promise.all(
      res.data.map(async (user) => {
        const roles = await getUserRoles(user.id); // Fetch roles for the current user.
        return { ...user, roles }; // Merge user data with their roles.
      }),
    );

    // Return a JSON response containing the list of users and their roles.
    return Response.json({ users });
  } catch (error) {
    // Log any errors that occur during the process.
    console.log("🔴🔴🔴🔴 ~ err: ", error);

    // Return a JSON response with the error information for debugging.
    return Response.json({ error });
  }
};
