import { ThemeProvider } from '@/components/theme-provider';
import { ModeToggle } from '@/components/ui/mode-toggle';
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import DynamicTextarea from './components/ui/textarea-prompt';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Link } from 'react-router-dom';
import useBackendStatus from './hooks/use-backend';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import usePipeline from './hooks/use-pipeline';

function App() {
	const { userInput, loading, response, handleInputChange, handleSubmit } = usePipeline();
	return (
		<ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
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
								<BreadcrumbPage>Task Time Estimation</BreadcrumbPage>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>

					<ModeToggle />
				</div>
				<div className="flex justify-center items-center pt-[25vh]">
					<DynamicTextarea
						label={useBackendStatus()}
						placeholder="Type/paste customer requirements here"
						id="message"
						value={userInput}
						onChange={handleInputChange}
					/>
					<div className="h-4 px-4">
						{loading ? (
							<LoadingSpinner className="ml-4" />
						) : (
							<Button variant="outline" onClick={handleSubmit} disabled={loading}>
								Submit
							</Button>
						)}
					</div>
				</div>
				<div className="flex justify-center items-center text-white pt-4">
					{response && (
						<Card>
							<CardHeader>
								<CardTitle>Time</CardTitle>
								<CardDescription>Estimated time required to complete the task</CardDescription>
							</CardHeader>
							<CardContent>
								<Button variant="destructive">
									<pre>{response}</pre>
								</Button>
							</CardContent>
						</Card>
					)}
				</div>
			</div>
		</ThemeProvider>
	);
}

export default App;
