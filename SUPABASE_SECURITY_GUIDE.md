# Supabase Security Guide

## 🔒 Security Best Practices

### Key Principles

1. **Never expose the service role key to users**
2. **Use Row Level Security (RLS) for all data access**
3. **Separate client-side and server-side configurations**
4. **Validate all user inputs**

## Environment Variables

### ✅ Safe for Client-Side (Public)

```env
REACT_APP_SUPABASE_URL=https://your-project-ref.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_anon_key_here
```

### 🔒 Server-Side Only (Private)

```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## Key Differences

| Key Type             | Purpose           | Where to Use     | Security Level    |
| -------------------- | ----------------- | ---------------- | ----------------- |
| **Anon Key**         | Public API access | Client-side code | ✅ Safe to expose |
| **Service Role Key** | Admin operations  | Server-side only | 🔒 Never expose   |

## Row Level Security (RLS)

### How It Works

- RLS policies control what data users can access
- Users can only see data they're authorized to see
- Policies are enforced at the database level

### Example RLS Policy

```sql
-- Users can only access their own shop's data
CREATE POLICY "Users can access their shop data" ON public.customers
  FOR ALL USING (shop_id = (auth.jwt() ->> 'shop_id')::uuid);
```

## File Structure

```
├── src/config/supabase-client.js     # Client-side (anon key only)
├── server/config/supabase.js         # Server-side (both keys)
├── configure-supabase.js             # User connection test
├── admin-setup-supabase.js           # Admin operations (server only)
└── deploy-schema.js                  # Schema deployment (server only)
```

## Security Checklist

- [ ] Service role key only in server environment
- [ ] Anon key used for client-side operations
- [ ] RLS policies enabled on all tables
- [ ] User authentication required for data access
- [ ] Input validation on all user inputs
- [ ] Error messages don't expose sensitive information

## Common Security Mistakes

### ❌ Don't Do This

```javascript
// NEVER expose service role key to client
const supabase = createClient(url, serviceRoleKey); // BAD!
```

### ✅ Do This Instead

```javascript
// Use anon key for client-side
const supabase = createClient(url, anonKey); // GOOD!
```

## Testing Security

### Test User Access

```bash
node configure-supabase.js
```

### Test Admin Operations

```bash
node admin-setup-supabase.js
```

## Monitoring

- Monitor your Supabase dashboard for unusual activity
- Check the "Logs" section for authentication events
- Review RLS policy effectiveness
- Audit user permissions regularly

## Emergency Response

If you accidentally expose the service role key:

1. **Immediately rotate the key** in Supabase dashboard
2. **Update your environment variables**
3. **Review logs** for unauthorized access
4. **Consider data audit** if necessary

## Additional Resources

- [Supabase Security Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [RLS Best Practices](https://supabase.com/docs/guides/auth/row-level-security#best-practices)
- [Environment Variables Guide](https://supabase.com/docs/guides/getting-started/environment-variables)
