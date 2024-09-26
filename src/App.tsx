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
import DynamicTextarea from "./components/ui/textarea-prompt";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

function App() {
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
						</DropdownMenuContent>
					</DropdownMenu>

					<Breadcrumb>
						<BreadcrumbList>
							<BreadcrumbItem>
								<BreadcrumbLink href="/">Home</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator />
							<BreadcrumbItem>
								<BreadcrumbLink href="/components">Components</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator />
							<BreadcrumbItem>
								<BreadcrumbPage>Breadcrumb</BreadcrumbPage>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>

					<ModeToggle />
				</div>
				<div className="flex justify-center items-center h-screen">
					<DynamicTextarea
						label="Status: Ready"
						placeholder="Type/paste customer requirements here"
						id="message"
					/>
					<div className="h-4 px-4">
						<Button variant="outline">Submit</Button>
					</div>
				</div>
			</div>
		</ThemeProvider>
	);
}

export default App;
