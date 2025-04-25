import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { User } from '@/types';

/**
 * Creates a new user account with the provided email, password, and name
 * Handles both authentication and user profile creation
 *
 * @param {string} email - The user's email address
 * @param {string} password - The user's password
 * @param {string} name - The user's display name
 * @returns {Promise<User | null>} The created user object if successful, null otherwise
 */
export async function signUp(email: string, password: string, name: string): Promise<User | null> {
  try {
    console.log(`Attempting to sign up user: ${email}`);

    // First, check if the user already exists in auth
    const { data: existingAuthData, error: existingAuthError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    // If user already exists in auth and can sign in, just return that user
    if (!existingAuthError && existingAuthData.user) {
      console.log(`User ${email} already exists in auth, logging in instead`);
      return await signIn(email, password);
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    });

    if (authError) {
      console.error('Supabase Auth signup error:', authError);
      throw authError;
    }

    if (!authData.user) {
      console.error('No user returned from Supabase Auth signup');
      return null;
    }

    console.log(`Auth signup successful for ${email}, user ID: ${authData.user.id}`);
    console.log('User needs email confirmation:', !authData.user.email_confirmed_at);

    // Email confirmation is now disabled in the database, so we don't need to check
    // Users are automatically logged in after signup
    console.log('Email confirmation disabled, user is automatically logged in');

    // Create user profile in our users table
    // Using the Supabase auth user ID as the ID for our users table
    console.log(`Creating user profile in database for ID: ${authData.user.id}`);

    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id, // Use auth ID as primary key
        name,
        email,
        avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
      })
      .select()
      .single();

    if (userError) {
      console.error('Error creating user profile:', userError);

      // If insert fails, try to get the user in case they already exist
      console.log(`Checking if user already exists with email: ${email}`);

      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (fetchError) {
        console.error('Error fetching existing user:', fetchError);
        throw fetchError;
      }

      if (!existingUser) {
        console.error('Failed to create or retrieve user profile');
        throw new Error('Failed to create or retrieve user profile');
      }

      console.log(`Found existing user: ${existingUser.id}`);

      // Return existing user
      return {
        id: existingUser.id,
        name: existingUser.name,
        email: existingUser.email,
        avatar: existingUser.avatar_url || '',
      };
    }

    console.log(`User profile created successfully: ${userData.id}`);

    // Return user and skip email confirmation for testing
    return {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      avatar: userData.avatar_url || '',
    };
  } catch (error) {
    console.error('Error during sign up:', error);
    return null;
  }
}

/**
 * Authenticates a user with the provided email and password
 * Retrieves the user profile or creates one if it doesn't exist
 *
 * @param {string} email - The user's email address
 * @param {string} password - The user's password
 * @returns {Promise<User | null>} The authenticated user object if successful, null otherwise
 */
export async function signIn(email: string, password: string): Promise<User | null> {
  try {
    console.log(`Attempting to sign in user: ${email}`);

    // First try Supabase auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // If auth error, log it but continue to try other methods
    if (authError) {
      console.error('Supabase Auth signin error:', authError);

      // Email confirmation is now disabled, so we ignore this error
      if (authError.message?.includes('Email not confirmed')) {
        console.log('Email confirmation is disabled, ignoring this error');
      } else {
        // This is a different error, so we should return null
        return null;
      }
    }

    // If Supabase auth succeeds
    if (!authError && authData.user) {
      console.log(`Auth signin successful for ${email}, user ID: ${authData.user.id}`);

      // Try to get user profile from our users table - first try by email
      let userData;
      let userError;

      // Try to get user by email first (primary lookup method)
      console.log(`Looking for user profile with email: ${email}`);

      ({ data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single());

      // If that fails, try by ID as fallback
      if (userError || !userData) {
        console.log(`User not found by email, trying ID: ${authData.user.id}`);

        ({ data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authData.user.id)
          .single());
      }

      if (userError || !userData) {
        console.error('Error finding user profile:', userError);

        // User exists in auth but not in our users table, create a profile
        console.log('Creating missing user profile');

        type AuthMetadata = {
          name?: string;
        };

        const userName = (authData.user.user_metadata as AuthMetadata)?.name || email.split('@')[0];

        ({ data: userData, error: userError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            name: userName,
            email: email,
            avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=random`,
          })
          .select()
          .single());

        if (userError) {
          console.error('Error creating missing user profile:', userError);
          throw userError;
        }

        console.log(`Created missing user profile: ${userData.id}`);
      } else {
        console.log(`Found user profile: ${userData.id}`);
      }

      // Convert to our app User type
      const user = {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        avatar: userData.avatar_url || '',
      };

      // Store in localStorage for offline use and quick access
      try {
        localStorage.setItem('currentUser', JSON.stringify(user));
      } catch (e) {
        console.error('Error storing user in localStorage:', e);
      }

      return user;
    }

    // For demo purposes, try to use test/seeded users when Supabase is not configured
    if (!isSupabaseConfigured() && process.env.NODE_ENV !== 'production') {
      // Define seeded test users
      type SeededUser = {
        id: string;
        email: string;
        name: string;
        avatar?: string;
      };

      const seededUsers: SeededUser[] = [
        {
          id: '00000000-0000-0000-0000-000000000001',
          email: 'alex@example.com',
          name: 'Alex Johnson',
        },
        {
          id: '00000000-0000-0000-0000-000000000002',
          email: 'taylor@example.com',
          name: 'Taylor Smith',
        },
      ];

      // Check if the email matches any seeded user
      const seededUser = seededUsers.find(u => u.email.toLowerCase() === email.toLowerCase());

      if (seededUser) {
        console.log(`Using seeded user for demo: ${seededUser.name}`);
        return {
          id: seededUser.id,
          name: seededUser.name,
          email: seededUser.email,
          avatar: seededUser.avatar || '',
        };
      }
    }

    // If we get here, authentication failed
    console.error('Authentication failed for email:', email);
    return null;
  } catch (error) {
    console.error('Error during sign in:', error);
    return null;
  }
}

/**
 * Signs out the current user from the application
 * Clears both Supabase session and local storage
 *
 * @returns {Promise<void>}
 */
export async function signOut(): Promise<void> {
  try {
    console.log('Signing out user');

    // Clear local storage first
    try {
      localStorage.removeItem('currentUser');
    } catch (e) {
      console.error('Error removing user from localStorage:', e);
    }

    // Then sign out from Supabase
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out from Supabase:', error);
    }
  } catch (error) {
    console.error('Error during sign out:', error);
  }
}

/**
 * Gets the current authenticated user
 * Tries from Supabase session first, then falls back to localStorage
 *
 * @returns {Promise<User | null>} The current user if authenticated, null otherwise
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    console.log('Getting current user');

    // Try to get the current session from Supabase
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Error getting session:', error);
      throw error;
    }

    // If we have a session with a user
    if (data.session?.user) {
      const authUser = data.session.user;
      console.log(`Found authenticated user: ${authUser.id}`);

      // Try to get the user profile from our users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (userError) {
        console.error('Error getting user profile:', userError);

        // Fallback: try to get user by email
        const { data: userByEmail, error: emailError } = await supabase
          .from('users')
          .select('*')
          .eq('email', authUser.email)
          .single();

        if (emailError || !userByEmail) {
          console.error('Error getting user by email:', emailError);

          // No user profile found, try to get from local storage as last resort
          try {
            const localUser = localStorage.getItem('currentUser');
            if (localUser) {
              return JSON.parse(localUser);
            }
          } catch (e) {
            console.error('Error getting user from localStorage:', e);
          }

          return null;
        }

        // Return user found by email
        return {
          id: userByEmail.id,
          name: userByEmail.name,
          email: userByEmail.email,
          avatar: userByEmail.avatar_url || '',
        };
      }

      // Return user found by ID
      return {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        avatar: userData.avatar_url || '',
      };
    }

    // No active session, try localStorage as fallback for offline usage
    try {
      const localUser = localStorage.getItem('currentUser');
      if (localUser) {
        console.log('No active session, using user from localStorage');
        return JSON.parse(localUser);
      }
    } catch (e) {
      console.error('Error getting user from localStorage:', e);
    }

    console.log('No authenticated user found');
    return null;
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    return null;
  }
}

/**
 * Updates the current user's profile information
 *
 * @param {string} userId - The ID of the user to update
 * @param {Partial<User>} updates - The fields to update (name, email, avatar)
 * @returns {Promise<User | null>} The updated user if successful, null otherwise
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<Omit<User, 'id'>>
): Promise<User | null> {
  try {
    console.log(`Updating profile for user: ${userId}`);

    // First, get the current user to make sure we have the latest data
    const { data: currentData, error: getCurrentError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (getCurrentError || !currentData) {
      console.error('Error getting current user data:', getCurrentError);
      return null;
    }

    // Prepare the update data
    const updateData: Record<string, unknown> = {};

    if (updates.name) {
      updateData.name = updates.name;
    }

    if (updates.email) {
      updateData.email = updates.email;
    }

    if (updates.avatar) {
      updateData.avatar_url = updates.avatar;
    }

    // Update the user profile
    const { data: userData, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating user profile:', updateError);
      return null;
    }

    // Return the updated user
    const updatedUser = {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      avatar: userData.avatar_url || '',
    };

    // Update localStorage
    try {
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    } catch (e) {
      console.error('Error updating user in localStorage:', e);
    }

    return updatedUser;
  } catch (error) {
    console.error('Error updating user profile:', error);
    return null;
  }
}
