// ./components/Chat/ChannelList.tsx

// Imports necessary modules for navigation and routing
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

// Defines the available chat channels with their IDs and display names
export const getChannelList = async () => {
  const resourceInstances = await fetch("/api/permit/resourceInstances").then(
    (res) => res.json(),
  );

  const channels = resourceInstances.map(
    (resourceInstance: { key: string }) => ({
      id: resourceInstance.key,
    }),
  );

  return channels;
};

const ChatChannelList = () => {
  // Retrieves the current path to determine the active channel
  const pathname = usePathname();
  const [channels, setChannels] = useState<{ id: string }[]>([]);

  useEffect(() => {
    const fetchChannels = async () => {
      const channels = await getChannelList();
      setChannels(channels);
    };
    fetchChannels();
  }, []);

  return (
    <ul className="flex flex-col">
      {channels.map((channel) => (
        <li key={channel.id}>
          {/* Creates a link for each channel */}
          <Link
            href={`/chat/${channel.id}`}
            className={`${
              pathname === `/chat/${channel.id}` ? "font-bold" : "" // Highlights the active channel
            }`}
          >
            <span className="truncate">
              {channel.id == "mod" ? "🔒" : "💬"} {channel.id}
            </span>{" "}
            {/* Displays the channel name */}
          </Link>
        </li>
      ))}
    </ul>
  );
};

export default ChatChannelList; // Exports the component for use in other parts of the application
