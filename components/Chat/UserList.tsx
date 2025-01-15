// ./components/Chat/UserList.tsx

import useUser from "@/hooks/useUser"; // Custom hook to fetch the current user's information.
import { useChannel } from "ably/react"; // Ably hook for real-time channel communication.
import { UserRead } from "permitio"; // Type definition for Permit.io user data.
import { useCallback, useEffect, useState } from "react";

/**
 * Fetches the list of users from the server using the Permit.io API.
 * @returns A JSON object containing the list of users.
 */
const getUserList = async () => {
  const res = await fetch("/api/permit/getUsers");
  return await res.json();
};

/**
 * Component to display and manage a list of chat users with promote/demote actions.
 * @param {Object} props - Component props.
 * @param {string} props.channelName - The name of the chat channel.
 */
const ChatUserList: React.FC<{ channelName: string }> = ({ channelName }) => {
  const { user: currentUser, getPermitUser } = useUser(); // Get the current logged-in user's details.
  const [users, setUsers] = useState<UserRead[]>([]); // State to hold the list of users.
  const [canPromote, setCanPromote] = useState(false); // State to determine if the current user can promote others.

  // Subscribe to the Ably channel for real-time updates.
  const { publish } = useChannel(channelName, (message) => {
    if (message.name === "PROMOTE" || message.name === "DEMOTE") {
      fetchUsers(); // Fetch the updated user list when a promote/demote event occurs.
      getPermitUser(); // Fetch the updated Permit.io user data when a promote/demote event occurs.
    }
  });

  /**
   * Fetches and updates the list of users, excluding the current user.
   */
  const fetchUsers = useCallback(async () => {
    const data = await getUserList();
    setUsers(
      data.users.filter((user: UserRead) => user.id !== currentUser?.id),
    );
  }, [currentUser?.id]);

  /**
   * Handles promoting a user to a moderator role.
   * @param {string} [userKey] - The unique identifier for the user to promote.
   */
  const handlePromoteUser = async (userKey?: string) => {
    try {
      const res = await fetch(
        `/api/permit/promoteUser?key=${userKey}&channel=${channelName}`,
      );
      if (!res.ok) throw new Error("Failed to promote user");

      // Notify other clients about the promotion.
      publish({
        name: "PROMOTE",
        data: {
          id: userKey,
          text: `User ${userKey} has been promoted to moderator`,
          avatarUrl: `https://www.tapback.co/api/avatar/${userKey}`,
          role: "moderator",
        },
      });
    } catch (error) {
      console.error("🔴 Error promoting user:", error);
    }
  };

  /**
   * Handles demoting a user from a moderator role.
   * @param {string} [userKey] - The unique identifier for the user to demote.
   */
  const handleDemoteUser = async (userKey?: string) => {
    try {
      const res = await fetch(
        `/api/permit/demoteUser?key=${userKey}&channel=${channelName}`,
      );
      if (!res.ok) throw new Error("Failed to demote user");

      // Notify other clients about the demotion.
      publish({
        name: "DEMOTE",
        data: {
          id: userKey,
          text: `User ${userKey} has been demoted from moderator`,
          avatarUrl: `https://www.tapback.co/api/avatar/${userKey}`,
          role: "participant",
        },
      });
    } catch (error) {
      console.error("🔴 Error demoting user:", error);
    }
  };

  // Fetch the list of users whenever the current user's ID changes.
  useEffect(() => {
    fetchUsers();
  }, [currentUser?.id, fetchUsers]);

  // Determine if the current user has permission to promote others.
  useEffect(() => {
    setCanPromote(
      !!currentUser?.roles?.find((role) => role.role === "moderator"),
    );
  }, [currentUser]);

  return (
    <ul className="flex h-full flex-col gap-2 rounded-2xl bg-gray-50 p-6 dark:bg-gray-800">
      {users.map((user) => (
        <li key={user.id}>
          <article className="text-sm">
            <div className="flex items-center justify-between gap-2">
              {/* Display user's name if available */}
              {user.first_name && (
                <p>
                  {user.first_name} {user.last_name}
                </p>
              )}
              {canPromote &&
                (!user?.roles?.find((role) => role.role === "moderator") ? (
                  <button
                    className="btn"
                    onClick={() => handlePromoteUser(user?.email)}
                  >
                    Promote
                  </button>
                ) : (
                  <button
                    className="btn"
                    onClick={() => handleDemoteUser(user?.email)}
                  >
                    Demote
                  </button>
                ))}
            </div>
          </article>
        </li>
      ))}
    </ul>
  );
};

export default ChatUserList;
