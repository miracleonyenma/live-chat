// ./app/api/permit/getUser/route.ts

// Import the authentication function to verify and retrieve the authenticated user's information.
import { auth } from "@/auth";

// Import the Permit.io instance to interact with the Permit API.
import permit from "@/lib/permit";

// Import the helper function to fetch a user's assigned roles.
import { getUserRoles } from "@/utils/permit";

// Define the GET handler for the API route.
export const GET = async () => {
  try {
    // Retrieve the authenticated user's email from the `auth` function.
    const userKey = (await auth())?.user?.email;

    // If the user's email is not found, throw an error.
    if (!userKey) throw new Error("User not found");

    // Fetch the user details from the Permit.io API using their email as the unique key.
    const res = await permit.api.users.get(userKey);

    // Fetch the roles assigned to the user using the `getUserRoles` utility function.
    const roles = await getUserRoles(res.id);

    // Merge the user details with their roles into a single object.
    const user = { ...res, roles };

    // Log the user details for debugging purposes.
    // console.log("🚀 ~ user: ", user);

    // Return the user data as a JSON response.
    return Response.json({ user });
  } catch (error) {
    // Log any errors that occur during the process for debugging.
    console.log("🔴🔴🔴🔴 ~ err: ", error);

    // Return an error response in JSON format.
    return Response.json({ error });
  }
};
