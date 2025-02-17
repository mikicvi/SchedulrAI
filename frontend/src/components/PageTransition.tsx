import { motion } from 'framer-motion';
import React from 'react';

const pageVariants = {
	initial: {
		opacity: 0,
		y: 20,
	},
	in: {
		opacity: 1,
		y: 0,
	},
	out: {
		opacity: 0,
		y: -20,
	},
};

const pageTransition = {
	type: 'spring',
	stiffness: 200,
	damping: 25,
	duration: 0.3,
};

const PageTransition = ({ children }: { children: React.ReactNode }) => (
	<motion.div
		style={{
			height: '100vh',
			overflow: 'hidden',
			display: 'flex',
			flexDirection: 'column',
		}}
		initial='initial'
		animate='in'
		exit='out'
		variants={pageVariants}
		transition={pageTransition}
	>
		{children}
	</motion.div>
);

export default PageTransition;
