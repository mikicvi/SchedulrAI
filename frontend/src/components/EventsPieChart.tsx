import * as React from 'react';
import { Label, Pie, PieChart } from 'recharts';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

interface EventsPieChartProps {
	data: { month: string; count: number; fill?: string }[];
	title: string;
	description?: string;
	footerContent: React.ReactNode;
}

export function EventsPieChart({ data, title, description, footerContent }: Readonly<EventsPieChartProps>) {
	const chartConfig = React.useMemo(() => {
		const config: ChartConfig = {
			events: {
				label: 'Events',
			},
		};

		// Add month configurations dynamically
		data.forEach((item) => {
			config[item.month] = {
				label: item.month,
				color: item.fill,
			};
		});

		return config;
	}, [data]);

	const totalEvents = React.useMemo(() => {
		return data.reduce((acc, curr) => acc + curr.count, 0);
	}, [data]);

	return (
		<Card className='flex flex-col'>
			<CardHeader className='items-center pb-0'>
				<CardTitle>{title}</CardTitle>
				<CardDescription>{description}</CardDescription>
			</CardHeader>
			<CardContent className='flex-1 pb-0'>
				<ChartContainer config={chartConfig} className='mx-auto aspect-square max-h-[250px]'>
					<PieChart>
						<ChartTooltip content={<ChartTooltipContent />} />
						<Pie
							data={data}
							dataKey='count'
							nameKey='month'
							innerRadius={60}
							strokeWidth={10}
							outerRadius={90}
						>
							<Label
								content={({ viewBox }) => {
									if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
										return (
											<text
												x={viewBox.cx}
												y={viewBox.cy}
												textAnchor='middle'
												dominantBaseline='middle'
											>
												<tspan
													x={viewBox.cx}
													y={viewBox.cy}
													className='fill-foreground text-3xl font-bold'
												>
													{totalEvents.toLocaleString()}
												</tspan>
												<tspan
													x={viewBox.cx}
													y={(viewBox.cy || 0) + 24}
													className='fill-muted-foreground'
												>
													Events
												</tspan>
											</text>
										);
									}
								}}
							/>
						</Pie>
					</PieChart>
				</ChartContainer>
			</CardContent>
			<CardFooter className='flex-col gap-2 text-sm'>{footerContent}</CardFooter>
		</Card>
	);
}
