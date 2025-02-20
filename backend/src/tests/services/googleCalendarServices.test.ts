const mockCalendarEvents = {
	list: jest.fn(),
	insert: jest.fn(),
	update: jest.fn(),
	delete: jest.fn(),
};
jest.mock('@googleapis/calendar', () => ({
	calendar: () => ({ events: mockCalendarEvents }),
}));

jest.mock('google-auth-library', () => ({
	OAuth2Client: jest.fn().mockImplementation(() => ({
		setCredentials: jest.fn(),
	})),
}));
jest.mock('../../services/authServices');
jest.mock('../../services/dbServices');

import { OAuth2Client } from 'google-auth-library';
import {
	syncEventToGoogle,
	deleteGoogleEvent,
	syncGoogleCalendarEvents,
	getGoogleCalendarEvents,
} from '../../services/googleCalendarServices';
import { getUserById, getAllEvents, updateEvent, deleteEvent, createEvent } from '../../services/dbServices';
import { refreshAccessToken } from '../../services/authServices';
import { Importance } from '../../models/event.model';

// Mock the calendar module at the top level

describe('Google Calendar Services', () => {
	let mockOAuth2Client: jest.Mocked<OAuth2Client>;

	beforeEach(() => {
		jest.clearAllMocks();

		// Set up default mock implementations
		mockCalendarEvents.list.mockResolvedValue({ data: { items: [] } });
		mockCalendarEvents.insert.mockResolvedValue({ data: { id: '1' } });
		mockCalendarEvents.update.mockResolvedValue({ data: { id: '1' } });
		mockCalendarEvents.delete.mockResolvedValue({ data: {} });

		mockOAuth2Client = {
			setCredentials: jest.fn(),
		} as any;

		(OAuth2Client as unknown as jest.Mock).mockImplementation(() => mockOAuth2Client);
		(refreshAccessToken as jest.Mock).mockResolvedValue('test-access-token');
		(getUserById as jest.Mock).mockResolvedValue({
			id: 1,
			googleId: 'test-google-id',
			calendarId: 1,
		});
		(getAllEvents as jest.Mock).mockResolvedValue([]);
		(updateEvent as jest.Mock).mockResolvedValue(undefined);
		(deleteEvent as jest.Mock).mockResolvedValue(undefined);
		(createEvent as jest.Mock).mockResolvedValue(undefined);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('getGoogleCalendarEvents', () => {
		it('should return null if user is not found', async () => {
			(getUserById as jest.Mock).mockResolvedValueOnce(null);

			const result = await getGoogleCalendarEvents(1);
			expect(result).toBeNull();
		});

		it('should return null if user has no Google ID', async () => {
			(getUserById as jest.Mock).mockResolvedValueOnce({ id: 1 });

			const result = await getGoogleCalendarEvents(1);
			expect(result).toBeNull();
		});

		it('should return calendar events successfully', async () => {
			const mockEvents = [{ id: '1', summary: 'Test Event' }];
			mockCalendarEvents.list.mockResolvedValueOnce({
				data: { items: mockEvents },
			});

			const result = await getGoogleCalendarEvents(1);
			expect(result).toEqual(mockEvents);
			expect(mockCalendarEvents.list).toHaveBeenCalled();
		});

		it('should return null on error while fetching events', async () => {
			mockCalendarEvents.list.mockRejectedValueOnce(new Error('Network Error'));
			const result = await getGoogleCalendarEvents(1);
			expect(result).toBeNull();
		});
	});

	describe('syncEventToGoogle', () => {
		const mockEvent = {
			title: 'Test Event',
			start: new Date(),
			end: new Date(),
			importance: Importance.UrgentImportant,
		};

		beforeEach(() => {
			// Reset sync protection for each test
			(syncEventToGoogle as any).syncProtection = new Map();
		});

		it('should create new event successfully', async () => {
			const expectedResponse = { id: '1', summary: 'Test Event' };
			mockCalendarEvents.list.mockResolvedValueOnce({ data: { items: [] } });
			mockCalendarEvents.insert.mockResolvedValueOnce({ data: expectedResponse });

			const result = await syncEventToGoogle(1, mockEvent);
			expect(result).toEqual(expectedResponse);
			expect(mockCalendarEvents.insert).toHaveBeenCalled();
		});

		it('should update existing event successfully', async () => {
			mockCalendarEvents.update.mockResolvedValueOnce({
				data: { id: '1', summary: 'Updated Event' },
			});

			const result = await syncEventToGoogle(1, mockEvent, 'existing-id');
			expect(result).toBeDefined();
			expect(mockCalendarEvents.update).toHaveBeenCalled();
		});

		it('should return null if event has invalid dates', async () => {
			const invalidEvent = {
				title: 'Invalid Dates',
				start: new Date(),
				end: new Date(''),
				importance: Importance.UrgentImportant,
			};
			const result = await syncEventToGoogle(1, invalidEvent, 'existing-id');
			expect(result).toBeNull();
		});

		it('should return null if duplicate event is detected', async () => {
			mockCalendarEvents.list.mockResolvedValueOnce({
				data: { items: [{ summary: 'Test Event', start: { dateTime: new Date().toISOString() } }] },
			});
			const result = await syncEventToGoogle(1, { title: 'Test Event', start: new Date(), end: new Date() });
			expect(result).toBeNull();
		});

		it('should return null if event is already in sync', async () => {
			// Start first sync without awaiting to simulate concurrent sync
			const firstSync = syncEventToGoogle(1, mockEvent);
			const result = await syncEventToGoogle(1, mockEvent);
			await firstSync;
			expect(result).toBeNull();
		});

		it('should return null if user is missing Google ID', async () => {
			(getUserById as jest.Mock).mockResolvedValueOnce({ id: 1 });

			const result = await syncEventToGoogle(1, mockEvent);
			expect(result).toBeNull();
		});

		it('should return null if user is missing', async () => {
			(getUserById as jest.Mock).mockResolvedValueOnce(null);

			const result = await syncEventToGoogle(1, mockEvent);
			expect(result).toBeNull();
		});
	});

	describe('deleteGoogleEvent', () => {
		it('should return false if user not found', async () => {
			(getUserById as jest.Mock).mockResolvedValueOnce(null);

			const result = await deleteGoogleEvent(1, 'test-event-id');
			expect(result).toBeFalsy();
		});

		it('should delete event successfully', async () => {
			mockCalendarEvents.delete.mockResolvedValueOnce({ data: {} });

			const result = await deleteGoogleEvent(1, 'test-event-id');
			expect(result).toBeTruthy();
			expect(mockCalendarEvents.delete).toHaveBeenCalledWith({
				auth: expect.any(Object),
				calendarId: 'primary',
				eventId: 'test-event-id',
			});
		});

		it('should return false if deletion fails with an error', async () => {
			mockCalendarEvents.delete.mockRejectedValueOnce(new Error('API Error'));
			const result = await deleteGoogleEvent(1, 'test-id');
			expect(result).toBeFalsy();
		});
	});

	describe('syncGoogleCalendarEvents', () => {
		beforeEach(() => {
			// Reset sync protection for each test
			(syncGoogleCalendarEvents as any).calendarSyncProtection = new Map();
		});

		it('should return false if sync is already in progress', async () => {
			// Start first sync without awaiting to simulate concurrent sync
			const firstSync = syncGoogleCalendarEvents(1);
			const result = await syncGoogleCalendarEvents(1);
			await firstSync;
			expect(result).toBeFalsy();
		});

		it('should sync events successfully', async () => {
			const mockGoogleEvents = [
				{
					id: '1',
					summary: 'Test Event',
					start: { dateTime: new Date().toISOString() },
					end: { dateTime: new Date().toISOString() },
					updated: new Date().toISOString(),
				},
			];

			mockCalendarEvents.list.mockResolvedValueOnce({
				data: { items: mockGoogleEvents },
			});

			const result = await syncGoogleCalendarEvents(1);
			expect(result).toBeTruthy();
			expect(mockCalendarEvents.list).toHaveBeenCalled();
		});

		it('should handle sync failures gracefully', async () => {
			mockCalendarEvents.list.mockRejectedValueOnce(new Error('API Error'));

			const result = await syncGoogleCalendarEvents(1);
			expect(result).toBeFalsy();
		});

		it('should return false if user is missing calendarId', async () => {
			(getUserById as jest.Mock).mockResolvedValueOnce({ id: 1, googleId: 'some-googleid' });
			const result = await syncGoogleCalendarEvents(1);
			expect(result).toBeFalsy();
		});

		it('should delete local events not found in Google', async () => {
			(getAllEvents as jest.Mock).mockResolvedValueOnce([
				{ id: 'local-1', resourceId: 'r-1' },
				{ id: 'local-2', resourceId: 'r-2' },
			]);
			mockCalendarEvents.list.mockResolvedValueOnce({ data: { items: [{ id: 'r-1' }] } });
			const mockDeleteEvent = deleteEvent as jest.Mock;

			await syncGoogleCalendarEvents(1);
			expect(mockDeleteEvent).toHaveBeenCalledWith('local-2');
		});

		it('should skip events with missing id', async () => {
			const mockGoogleEvents = [
				{
					start: { dateTime: new Date().toISOString() },
					updated: new Date().toISOString(),
				},
			];
			mockCalendarEvents.list.mockResolvedValueOnce({ data: { items: mockGoogleEvents } });
			(getAllEvents as jest.Mock).mockResolvedValueOnce([]);

			const result = await syncGoogleCalendarEvents(1);
			expect(result).toBeTruthy();
			expect(createEvent).not.toHaveBeenCalled();
			expect(updateEvent).not.toHaveBeenCalled();
		});

		it('should skip events with missing start dateTime', async () => {
			const mockGoogleEvents = [{ id: 'event-1', updated: new Date().toISOString(), start: {}, end: {} }];
			mockCalendarEvents.list.mockResolvedValueOnce({ data: { items: mockGoogleEvents } });
			(getAllEvents as jest.Mock).mockResolvedValueOnce([]);

			const result = await syncGoogleCalendarEvents(1);
			expect(result).toBeTruthy();
			expect(createEvent).not.toHaveBeenCalled();
			expect(updateEvent).not.toHaveBeenCalled();
		});

		it('should skip duplicates already processed', async () => {
			const mockGoogleEvents = [
				{
					id: 'event-1',
					start: { dateTime: new Date().toISOString() },
					updated: new Date().toISOString(),
				},
				{
					id: 'event-1',
					start: { dateTime: new Date().toISOString() },
					updated: new Date().toISOString(),
				},
			];
			mockCalendarEvents.list.mockResolvedValueOnce({ data: { items: mockGoogleEvents } });
			(getAllEvents as jest.Mock).mockResolvedValueOnce([]);

			const result = await syncGoogleCalendarEvents(1);
			expect(result).toBeTruthy();
			expect(createEvent).toHaveBeenCalledTimes(1);
		});

		it('should update local event if Google event is more recent', async () => {
			const oldUpdateTime = new Date(Date.now() - 60_000);
			const mockGoogleEvents = [
				{
					id: 'event-1',
					start: { dateTime: new Date().toISOString() },
					end: { dateTime: new Date().toISOString() },
					updated: new Date().toISOString(),
				},
			];
			mockCalendarEvents.list.mockResolvedValueOnce({ data: { items: mockGoogleEvents } });
			(getAllEvents as jest.Mock).mockResolvedValueOnce([
				{
					id: 'local-1',
					resourceId: 'event-1',
					updatedAt: oldUpdateTime,
				},
			]);

			const result = await syncGoogleCalendarEvents(1);
			expect(result).toBeTruthy();
			expect(updateEvent).toHaveBeenCalled();
			expect(createEvent).not.toHaveBeenCalled();
		});

		it('should create a new local event if not found', async () => {
			const mockGoogleEvents = [
				{
					id: 'event-2',
					start: { dateTime: new Date().toISOString() },
					end: { dateTime: new Date().toISOString() },
					updated: new Date().toISOString(),
				},
			];
			mockCalendarEvents.list.mockResolvedValueOnce({ data: { items: mockGoogleEvents } });
			(getAllEvents as jest.Mock).mockResolvedValueOnce([]);

			const result = await syncGoogleCalendarEvents(1);
			expect(result).toBeTruthy();
			expect(createEvent).toHaveBeenCalled();
			expect(updateEvent).not.toHaveBeenCalled();
		});

		it('should not update local event if Google is not more recent', async () => {
			const futureUpdateTime = new Date(Date.now() + 60_000);
			const mockGoogleEvents = [
				{
					id: 'event-3',
					start: { dateTime: new Date().toISOString() },
					end: { dateTime: new Date().toISOString() },
					updated: new Date().toISOString(),
				},
			];
			mockCalendarEvents.list.mockResolvedValueOnce({ data: { items: mockGoogleEvents } });
			(getAllEvents as jest.Mock).mockResolvedValueOnce([
				{
					id: 'local-3',
					resourceId: 'event-3',
					updatedAt: futureUpdateTime,
				},
			]);

			const result = await syncGoogleCalendarEvents(1);
			expect(result).toBeTruthy();
			expect(updateEvent).not.toHaveBeenCalled();
			expect(createEvent).not.toHaveBeenCalled();
		});
	});
});
