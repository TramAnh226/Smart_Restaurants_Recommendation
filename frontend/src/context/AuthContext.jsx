import { createContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabase';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const lastUserId = useRef(null);

  const fetchUserProfile = async (authUser) => {
    console.log('[AuthContext] fetchUserProfile started for:', authUser?.email);
    try {
      console.log('[AuthContext] Querying users table...');
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error) {
        console.warn('[AuthContext] users query returned error:', error);
        if (error.code === 'PGRST116') { // Row not found
          console.log('[AuthContext] User row not found, creating default profile...');
          const defaultProfile = {
            id: authUser.id,
            name: authUser.user_metadata?.name || authUser.email.split('@')[0],
            taste_preferences: [],
            preferred_styles: [],
            allergy_preferences: [],
            preferred_countries: []
          };
          const { error: insertError } = await supabase
            .from('users')
            .upsert(defaultProfile);
          if (insertError) {
            console.error('[AuthContext] default profile upsert failed:', insertError);
            throw insertError;
          }
          console.log('[AuthContext] Default profile created successfully');
          return {
            ...defaultProfile,
            email: authUser.email
          };
        } else {
          throw error;
        }
      } else {
        console.log('[AuthContext] User profile fetched successfully:', data);
        let localPrefs = {};
        try {
          localPrefs = JSON.parse(localStorage.getItem(`prefs_${authUser.id}`) || '{}');
        } catch (e) {
          console.error('Error parsing local preferences:', e);
        }
        return {
          ...data,
          email: authUser.email,
          allergy_preferences: data.allergy_preferences || [],
          preferred_countries: data.preferred_countries || [],
        };
      }
    } catch (err) {
      console.error('Error fetching user profile inside fetchUserProfile catch:', err);
      let localPrefs = {};
      try {
        localPrefs = JSON.parse(localStorage.getItem(`prefs_${authUser.id}`) || '{}');
      } catch (e) {
        console.error('Error parsing local preferences in catch:', e);
      }
      return {
        id: authUser.id,
        email: authUser.email,
        name: authUser.user_metadata?.name || authUser.email,
        taste_preferences: [],
        preferred_styles: [],
        allergy_preferences: [],
        preferred_countries: []
      };
    }
  };

  useEffect(() => {
    let active = true;
    console.log('[AuthContext] useEffect mounted. active = true');

    const handleSessionChange = async (currentSession) => {
      if (!active) return;

      setSession(currentSession);
      const currentUserId = currentSession?.user?.id || null;

      if (currentUserId !== lastUserId.current) {
        lastUserId.current = currentUserId;

        if (currentSession?.user) {
          // Set loading to false immediately so the user can enter the app
          setLoading(false);

          // Fetch user profile in the background
          try {
            const profile = await fetchUserProfile(currentSession.user);
            if (active && lastUserId.current === currentUserId) {
              setUser(profile);
            }
          } catch (err) {
            console.error('[AuthContext] Background profile fetch failed:', err);
          }
        } else {
          setUser(null);
          setLoading(false);
        }
      } else {
        // Same user ID, session already processed. Make sure loading is false.
        setLoading(false);
      }
    };

    // Get initial session
    console.log('[AuthContext] Calling supabase.auth.getSession()...');
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      console.log('[AuthContext] getSession resolved, session exists:', !!initialSession);
      handleSessionChange(initialSession);
    }).catch(err => {
      console.error('[AuthContext] getSession failed:', err);
      if (active) setLoading(false);
    });

    // Listen for auth changes
    console.log('[AuthContext] Registering onAuthStateChange...');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log('[AuthContext] onAuthStateChange event fired:', event, 'session exists:', !!currentSession);
      handleSessionChange(currentSession);
    });

    return () => {
      console.log('[AuthContext] useEffect cleanup. setting active = false');
      active = false;
      subscription?.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      if (data?.user) {
        const profile = await fetchUserProfile(data.user);
        setUser(profile);
        return { success: true, user: profile };
      }
      return { success: false, error: 'Đăng nhập không thành công' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const register = async (email, password, name) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
        },
      });
      if (error) throw error;

      if (data?.user) {
        const defaultProfile = {
          id: data.user.id,
          name: name || email.split('@')[0],
          taste_preferences: [],
          preferred_styles: [],
          allergy_preferences: [],
          preferred_countries: []
        };

        const { error: dbError } = await supabase
          .from('users')
          .upsert(defaultProfile);
        if (dbError) {
          console.error("Database user profile creation failed:", dbError);
        }

        const userObj = {
          ...defaultProfile,
          email: data.user.email
        };
        setUser(userObj);
        return { success: true, user: userObj };
      }
      return { success: false, error: 'Đăng ký không thành công' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('Logout error:', error.message);
    }
  };

  const updateUser = async (updates) => {
    if (!user) return { success: false, error: 'Chưa đăng nhập' };

    try {
      let updatedData = {};
      if (Object.keys(updates).length > 0) {
        const { data, error } = await supabase
          .from('users')
          .update(updates)
          .eq('id', user.id)
          .select()
          .single();
        if (error) throw error;
        updatedData = data;
      }

      const updatedUser = {
        ...user,
        ...updatedData,
        taste_preferences: updatedData.taste_preferences !== undefined ? updatedData.taste_preferences : user.taste_preferences || [],
        preferred_styles: updatedData.preferred_styles !== undefined ? updatedData.preferred_styles : user.preferred_styles || [],
        allergy_preferences: updatedData.allergy_preferences !== undefined ? updatedData.allergy_preferences : user.allergy_preferences || [],
        preferred_countries: updatedData.preferred_countries !== undefined ? updatedData.preferred_countries : user.preferred_countries || []
      };
      setUser(updatedUser);
      return { success: true, user: updatedUser };
    } catch (error) {
      console.error('Error updating user profile:', error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Re-fetch user profile directly from the users table.
   * Call this on page mount to pick up preference changes
   * made from another device or browser tab.
   */
  const refreshProfile = async () => {
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (!currentSession?.user) return;
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', currentSession.user.id)
        .single();
      if (error) throw error;
      setUser((prev) => ({
        ...prev,
        ...data,
        email: currentSession.user.email,
        taste_preferences: data.taste_preferences || [],
        preferred_styles: data.preferred_styles || [],
        allergy_preferences: data.allergy_preferences || [],
        preferred_countries: data.preferred_countries || [],
      }));
    } catch (err) {
      console.error('refreshProfile error:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token: session?.access_token || null,
        loading,
        login,
        register,
        logout,
        updateUser,
        refreshProfile,
        isAuthenticated: !!session,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

