// ./types/user.ts

// Importing necessary types from the "permitio" package.
// `RoleAssignmentRead` represents the structure of role assignment data,
// and `UserRead` represents the structure of user data.
import { User } from "next-auth";
import { RoleAssignmentRead, UserRead } from "permitio";

// Define a new type `PermitUser` by combining `UserRead` and `RoleAssignmentRead`.
// This represents a user with role assignment information in the context of Permit.io.
type PermitUser = UserRead & RoleAssignmentRead & Partial<User>;

// Export the `PermitUser` type for use in other parts of the application.
// This allows consistent typing for users with roles and permissions.
export type { PermitUser };
