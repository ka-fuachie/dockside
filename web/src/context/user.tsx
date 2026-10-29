import { Accessor, createContext, createMemo, useContext } from "solid-js";
import { User } from "@/data/users";

const UserContext = createContext<Accessor<User>>();

export function UserProvider(props: { user: User; children: any }) {
  const user = createMemo(() => props.user)
  return <UserContext value={user}>{props.children}</UserContext>;
}

export function useUser() {
  const user = useContext(UserContext);
  if (!user) throw new Error("useUser must be used within UserProvider");
  return user;
}

export function useIsAdmin() {
  const user = useUser();
  return () => user().role === "ADMIN";
}
