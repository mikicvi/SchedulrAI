// src/components/Layout.tsx
import { ThemeProvider } from "@/components/theme-provider";
import { ModeToggle } from "@/components/ui/mode-toggle";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "react-router-dom";

const Layout = ({ children, breadcrumb }: { children: React.ReactNode; breadcrumb: React.ReactNode }) => {
	return (
		<ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
			<div className="flex flex-col h-full">
				<div className="flex justify-between items-start p-4">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Avatar>
								<AvatarImage /* user photo from backend*/ alt="Avatar" />
								<AvatarFallback>VM</AvatarFallback>
							</Avatar>
						</DropdownMenuTrigger>
						<DropdownMenuContent>
							<DropdownMenuLabel>Username</DropdownMenuLabel>
							<DropdownMenuSeparator />
							<DropdownMenuItem asChild>
								<Link to="/profile">Profile</Link>
							</DropdownMenuItem>
							<DropdownMenuItem asChild>
								<Link to="/settings">Settings</Link>
							</DropdownMenuItem>
							<DropdownMenuItem asChild>
								<Link to="/logout">Logout</Link>
							</DropdownMenuItem>
							<DropdownMenuItem asChild>
								<Link to="/profile-form">Profile Form</Link>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>

					{breadcrumb}

					<ModeToggle />
				</div>
				<div className="flex justify-center items-center h-screen">{children}</div>
			</div>
		</ThemeProvider>
	);
};

export default Layout;
