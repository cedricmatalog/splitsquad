import { supabase } from '@/lib/supabase';
import { User } from '@/types';

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

      // Try to get user profile from our users table - first try by ID
      let userData;
      let userError;

      // Try to get user by ID (which should match the auth user ID)
      console.log(`Looking for user profile with ID: ${authData.user.id}`);

      ({ data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single());

      // If that fails, try by email
      if (userError || !userData) {
        console.log(`User not found by ID, trying email: ${email}`);

        ({ data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
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

      // Store user in localStorage for persistence
      try {
        localStorage.setItem('currentUser', JSON.stringify(user));
        console.log('User stored in localStorage for persistence');
      } catch (e) {
        console.error('Error storing user in localStorage:', e);
      }

      return user;
    }

    // If Supabase auth fails, try to find user in localStorage
    // This is for demo/seeded users with password "password123"
    if (password === 'password123') {
      console.log('Trying seeded user login with password123');

      // Try to get the user from the database by email
      console.log(`Looking for seeded user with email: ${email}`);

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (!userError && userData) {
        console.log(`Found seeded user in database: ${userData.id}`);
        return {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          avatar: userData.avatar_url || '',
        };
      } else if (userError) {
        console.error('Error finding seeded user in database:', userError);
      }

      // If still not found, check if there's a user in localStorage
      // This fallback is for the demo data
      console.log('Checking localStorage for seeded users');

      try {
        const storedUsers = localStorage.getItem('users');
        if (storedUsers) {
          const users = JSON.parse(storedUsers);
          // Define a type for the seeded user
          type SeededUser = {
            id: string;
            email: string;
            name: string;
            avatar?: string;
          };
          const user = users.find((u: SeededUser) => u.email.toLowerCase() === email.toLowerCase());

          if (user) {
            console.log(`Found seeded user in localStorage: ${user.id}`);
            return user;
          }
        }

        console.log('No matching user found in localStorage');
      } catch (e) {
        console.error('Error checking localStorage for users:', e);
      }
    }

    console.log('All login methods failed');
    return null;
  } catch (error) {
    console.error('Error during sign in:', error);
    return null;
  }
}

export async function signOut(): Promise<void> {
  try {
    console.log('Signing out user');
    await supabase.auth.signOut();

    // Remove the user from localStorage
    try {
      localStorage.removeItem('currentUser');
      console.log('User removed from localStorage');
    } catch (e) {
      console.error('Error removing user from localStorage:', e);
    }
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    console.log('Checking for current user session');

    // First, check if there's an active Supabase session
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError) {
      console.error('Error getting session:', authError);
      throw authError;
    }

    if (session?.user) {
      console.log(`Active session found for user: ${session.user.id}`);

      // Get user profile from our users table
      let userData;
      let userError;

      // Try to get user by ID (which should match the auth user ID)
      console.log(`Looking for user profile with ID: ${session.user.id}`);

      ({ data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single());

      // If that fails, try by email
      if (userError || !userData) {
        console.log(`User not found by ID, trying email: ${session.user.email}`);

        ({ data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('email', session.user.email)
          .single());

        if (userError || !userData) {
          console.error('Could not find user profile');
          return null;
        }
      }

      console.log(`Found user profile: ${userData.id}`);

      // Convert to our app User type
      return {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        avatar: userData.avatar_url || '',
      };
    }

    // If no Supabase session, check localStorage for persisted user
    console.log('No active Supabase session, checking localStorage');

    try {
      const persistedUser = localStorage.getItem('currentUser');
      if (persistedUser) {
        const user = JSON.parse(persistedUser);
        console.log(`Found persisted user in localStorage: ${user.id}`);

        // Verify that this user exists in the database
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (!userError && userData) {
          console.log(`Verified persisted user exists in database: ${userData.id}`);
          return {
            id: userData.id,
            name: userData.name,
            email: userData.email,
            avatar: userData.avatar_url || '',
          };
        } else {
          console.log('Persisted user not found in database, removing from localStorage');
          localStorage.removeItem('currentUser');
        }
      }
    } catch (e) {
      console.error('Error checking localStorage:', e);
    }

    console.log('No active session found');
    return null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}
