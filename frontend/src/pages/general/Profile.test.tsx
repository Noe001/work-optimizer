import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Profile from './Profile'; // Adjust path as necessary
import userService from '@/services/userService'; // Adjust path as necessary
import { useToast } from '@/components/ui/use-toast'; // Adjust path as necessary

// Mock userService
jest.mock('@/services/userService');
const mockedUserService = userService as jest.Mocked<typeof userService>;

// Mock useToast
jest.mock('@/components/ui/use-toast', () => ({
  useToast: jest.fn(),
}));
const mockedUseToast = useToast as jest.MockedFunction<typeof useToast>;
const mockToast = jest.fn();

// Default profile data
const initialProfile = {
  name: '田中 太郎',
  email: 'tanaka@example.com',
  department: '営業部',
  position: 'マネージャー',
  bio: '自己紹介文です。',
  avatarUrl: '/images/circle-user-round.png',
};

describe('Profile Page', () => {
  beforeEach(() => {
    // Reset mocks for each test
    jest.clearAllMocks();
    mockedUseToast.mockReturnValue({ toast: mockToast });
    // Mock initial profile state if Profile component fetches it (not in current impl)
    // For now, Profile uses internal useState initialized with similar data.
  });

  const getInputs = () => ({
    nameInput: screen.getByLabelText(/名前/) as HTMLInputElement,
    emailInput: screen.getByLabelText(/メールアドレス/) as HTMLInputElement,
    bioTextarea: screen.getByLabelText(/自己紹介/) as HTMLTextAreaElement,
    departmentInput: screen.getByLabelText(/部門/) as HTMLInputElement,
    positionInput: screen.getByLabelText(/ポジション/) as HTMLInputElement,
  });

  test('Initial Render: displays profile info, fields disabled, Edit visible', () => {
    render(<Profile />);

    const { nameInput, emailInput, bioTextarea, departmentInput, positionInput } = getInputs();

    expect(nameInput).toHaveValue(initialProfile.name);
    expect(emailInput).toHaveValue(initialProfile.email);
    // Bio is empty in default state of component, let's test against that.
    // If bio was pre-filled and part of initialProfile, this would be:
    // expect(bioTextarea).toHaveValue(initialProfile.bio);
    expect(bioTextarea).toHaveValue(''); // Default state in component for bio is empty
    expect(departmentInput).toHaveValue(initialProfile.department);
    expect(positionInput).toHaveValue(initialProfile.position);

    expect(nameInput).toBeDisabled();
    expect(emailInput).toBeDisabled();
    expect(bioTextarea).toBeDisabled();
    expect(departmentInput).toBeDisabled();
    expect(positionInput).toBeDisabled();

    expect(screen.getByRole('button', { name: /編集/ })).toBeVisible();
    expect(screen.queryByRole('button', { name: /保存/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /キャンセル/ })).not.toBeInTheDocument();
  });

  test('Edit Mode Activation: enables fields, shows Save/Cancel, hides Edit', () => {
    render(<Profile />);
    fireEvent.click(screen.getByRole('button', { name: /編集/ }));

    const { nameInput, emailInput, bioTextarea, departmentInput, positionInput } = getInputs();
    expect(nameInput).toBeEnabled();
    expect(emailInput).toBeEnabled();
    expect(bioTextarea).toBeEnabled();
    expect(departmentInput).toBeEnabled();
    expect(positionInput).toBeEnabled();

    expect(screen.getByRole('button', { name: /保存/ })).toBeVisible();
    expect(screen.getByRole('button', { name: /キャンセル/ })).toBeVisible();
    expect(screen.queryByRole('button', { name: /編集/ })).not.toBeInTheDocument();
  });

  test('Data Modification & Cancellation: reverts changes, disables fields, resets buttons', () => {
    render(<Profile />);
    fireEvent.click(screen.getByRole('button', { name: /編集/ }));

    const { nameInput, bioTextarea } = getInputs();
    fireEvent.change(nameInput, { target: { value: 'New Name' } });
    fireEvent.change(bioTextarea, { target: { value: 'New Bio' } });

    expect(nameInput).toHaveValue('New Name');
    expect(bioTextarea).toHaveValue('New Bio');

    fireEvent.click(screen.getByRole('button', { name: /キャンセル/ }));

    expect(nameInput).toHaveValue(initialProfile.name);
    // Bio was initially empty in the component's state
    expect(bioTextarea).toHaveValue('');
    
    expect(nameInput).toBeDisabled();
    expect(bioTextarea).toBeDisabled();

    expect(screen.getByRole('button', { name: /編集/ })).toBeVisible();
    expect(screen.queryByRole('button', { name: /保存/ })).not.toBeInTheDocument();
  });

  test('Data Modification & Successful Save: calls API, disables fields, resets buttons, shows success toast', async () => {
    render(<Profile />);
    mockedUserService.updateUserProfileData.mockResolvedValue({ success: true, message: 'Success', data: {} as any });

    fireEvent.click(screen.getByRole('button', { name: /編集/ }));

    const { nameInput, bioTextarea } = getInputs();
    const updatedProfile = {
      ...initialProfile, // Use the component's initial state as base
      bio: 'Updated Bio', // Since bio starts empty
      name: 'Updated Name',
    };
    
    fireEvent.change(nameInput, { target: { value: updatedProfile.name } });
    fireEvent.change(bioTextarea, { target: { value: updatedProfile.bio } });

    fireEvent.click(screen.getByRole('button', { name: /保存/ }));

    await waitFor(() => {
      expect(mockedUserService.updateUserProfileData).toHaveBeenCalledWith(
        expect.objectContaining({
          name: updatedProfile.name,
          bio: updatedProfile.bio,
          email: initialProfile.email, // Email wasn't changed
        })
      );
    });

    expect(nameInput).toBeDisabled();
    expect(bioTextarea).toBeDisabled();
    expect(screen.getByRole('button', { name: /編集/ })).toBeVisible();
    expect(mockToast).toHaveBeenCalledWith({
      title: "成功",
      description: "プロフィールが正常に更新されました。",
    });
  });

  test('Data Modification & Failed Save: calls API, fields enabled, Save/Cancel visible, shows error toast', async () => {
    render(<Profile />);
    mockedUserService.updateUserProfileData.mockResolvedValue({ success: false, message: 'API Error' });

    fireEvent.click(screen.getByRole('button', { name: /編集/ }));

    const { nameInput } = getInputs();
    fireEvent.change(nameInput, { target: { value: 'Attempted Update Name' } });

    fireEvent.click(screen.getByRole('button', { name: /保存/ }));

    await waitFor(() => {
      expect(mockedUserService.updateUserProfileData).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Attempted Update Name' })
      );
    });
    
    expect(nameInput).toBeEnabled();
    expect(screen.getByRole('button', { name: /保存/ })).toBeVisible();
    expect(screen.getByRole('button', { name: /キャンセル/ })).toBeVisible();
    expect(mockToast).toHaveBeenCalledWith({
      title: "エラー",
      description: "API Error",
      variant: "destructive",
    });
  });
});
