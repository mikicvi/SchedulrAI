import { useEffect } from 'react';
import Layout from './Layout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import ProfileForm from '@/components/ProfileForm';
import { useUser } from '@/contexts/UserContext';
import { useProfileStats } from '@/hooks/use-profile-stats';
import { useProfileData } from '@/hooks/use-profile-data';
import { AccountOverview } from '@/components/AccountOverview';

export function Profile() {
	const { user } = useUser();
	const { stats, formattedEventsData, fetchStats } = useProfileStats();
	const { profileData, fetchProfileData } = useProfileData();

	useEffect(() => {
		if (user) {
			fetchStats();
			fetchProfileData();
		}
	}, [user]);

	return (
		<Layout breadcrumbItems={[{ title: 'Profile' }]}>
			<Card>
				<div className='container mx-auto p-4 space-y-6'>
					<div className='grid gap-6 md:grid-cols-2'>
						{/* User Profile Form */}
						<Card>
							<CardHeader>
								<h2 className='text-2xl font-bold'>Profile Settings</h2>
							</CardHeader>
							<CardContent>
								{profileData && (
									<ProfileForm defaultValues={profileData} onSuccess={fetchProfileData} />
								)}
							</CardContent>
						</Card>

						{/* Account Overview */}
						<AccountOverview
							stats={stats}
							formattedEventsData={formattedEventsData}
							hasGoogleAccount={user?.googleUser}
						/>
					</div>
				</div>
			</Card>
		</Layout>
	);
}

export default Profile;
