// import { useState } from 'react';
// import { useMutation, useQuery } from '@tanstack/react-query';
// import { useNavigate } from 'react-router-dom';
// import {
//   RiShieldCheckLine,
//   RiLockPasswordLine,
//   RiFingerprintLine,
//   RiLogoutBoxLine,
//   RiDeleteBin6Line,
//   RiAlertLine,
// } from 'react-icons/ri';
// import authApi from '@/api/auth.api';
// import { useAuth } from '@/hooks/useAuth';
// import { StatusBadge } from '@/components/shared/StatusBadge';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Switch } from '@/components/ui/switch';
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogDescription,
//   DialogFooter,
// } from '@/components/ui/dialog';
// import { toast } from '@/hooks/useToast';
// import { ApiError, unwrapEnvelope } from '@/lib/fetchClient';
// import type { SecurityQuestionsStatus } from '@/api/auth.api';
// import type { User } from '@/types';

// export default function Profile() {
//   const { user, logout, updateProfile } = useAuth();
//   const navigate = useNavigate();

//   const [editOpen, setEditOpen] = useState(false);
//   const [firstName, setFirstName] = useState(user?.firstName ?? '');
//   const [lastName, setLastName] = useState(user?.lastName ?? '');
//   const [phone, setPhone] = useState(user?.phone ?? '');

//   const [pwOpen, setPwOpen] = useState(false);
//   const [currentPassword, setCurrentPassword] = useState('');
//   const [newPassword, setNewPassword] = useState('');
//   const [confirmNewPassword, setConfirmNewPassword] = useState('');

//   const [deactivateOpen, setDeactivateOpen] = useState(false);
//   const [deleteOpen, setDeleteOpen] = useState(false);

//   const { data: securityStatus } = useQuery({
//     queryKey: ['auth', 'security-questions'],
//     queryFn: () => authApi.getSecurityQuestionsStatus().then((r) => unwrapEnvelope<SecurityQuestionsStatus>(r)),
//   });

//   const updateProfileMutation = useMutation({
//     mutationFn: authApi.updateProfile,
//     onSuccess: (res) => {
//       updateProfile(unwrapEnvelope<User>(res));
//       toast.success('Profile updated');
//       setEditOpen(false);
//     },
//     onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Update failed'),
//   });

//   const changePasswordMutation = useMutation({
//     mutationFn: authApi.changePassword,
//     onSuccess: () => {
//       toast.success('Password changed successfully');
//       setPwOpen(false);
//       setCurrentPassword('');
//       setNewPassword('');
//       setConfirmNewPassword('');
//     },
//     onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Failed to change password'),
//   });

//   const biometricMutation = useMutation({
//     mutationFn: authApi.setBiometric,
//     onSuccess: () => toast.success('Biometric login preference updated'),
//     onError: () => toast.error('Failed to update biometric setting'),
//   });

//   const deactivateMutation = useMutation({
//     mutationFn: authApi.deactivateAccount,
//     onSuccess: async () => {
//       toast.success('Account deactivated');
//       await logout();
//       navigate('/login');
//     },
//     onError: () => toast.error('Failed to deactivate account'),
//   });

//   const deleteMutation = useMutation({
//     mutationFn: authApi.deleteAccount,
//     onSuccess: async () => {
//       toast.success('Account deleted');
//       await logout();
//       navigate('/login');
//     },
//     onError: () => toast.error('Failed to delete account'),
//   });

//   if (!user) return null;

//   const displayName =
//     user.role === 'partner'
//       ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
//       : user.investorType === 'corporate'
//       ? (user.companyName ?? 'Corporate Investor')
//       : `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();

//   return (
//     <div className="space-y-6">
//       <div>
//         <h1 className="text-2xl font-bold text-white">Profile</h1>
//         <p className="text-white/50 text-sm mt-1">Manage your account and security settings.</p>
//       </div>

//       {/* Profile card */}
//       <Card>
//         <CardContent className="p-5 flex items-center gap-4">
//           <div className="w-16 h-16 rounded-2xl bg-accent/15 flex items-center justify-center text-accent text-2xl font-bold shrink-0">
//             {displayName.charAt(0).toUpperCase() || 'U'}
//           </div>
//           <div className="flex-1 min-w-0">
//             <p className="text-white font-semibold truncate">{displayName || 'User'}</p>
//             <p className="text-white/50 text-sm truncate">{user.email}</p>
//             <p className="text-white/50 text-sm">{user.phone}</p>
//             <div className="flex items-center gap-2 mt-2">
//               {user.role === 'investor' && <StatusBadge status={user.kycStatus} />}
//               <span className="text-xs text-white/40 capitalize">{user.role}</span>
//             </div>
//           </div>
//           <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
//             Edit
//           </Button>
//         </CardContent>
//       </Card>

//       {/* Security */}
//       <Card>
//         <CardHeader>
//           <CardTitle className="text-base flex items-center gap-2">
//             <RiShieldCheckLine className="text-accent" />
//             Security
//           </CardTitle>
//         </CardHeader>
//         <CardContent className="pt-0 space-y-1">
//           <button
//             onClick={() => setPwOpen(true)}
//             className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-white/5 transition-colors text-left"
//           >
//             <RiLockPasswordLine className="text-white/50 h-5 w-5" />
//             <div className="flex-1">
//               <p className="text-white text-sm font-medium">Change Password</p>
//               <p className="text-white/40 text-xs">Update your account password</p>
//             </div>
//           </button>
//           <div className="flex items-center gap-3 w-full p-3 rounded-xl">
//             <RiFingerprintLine className="text-white/50 h-5 w-5" />
//             <div className="flex-1">
//               <p className="text-white text-sm font-medium">Biometric Login</p>
//               <p className="text-white/40 text-xs">Use Face ID / fingerprint to sign in</p>
//             </div>
//             <Switch
//               onCheckedChange={(checked) => biometricMutation.mutate({ enabled: checked })}
//             />
//           </div>
//           <div className="flex items-center gap-3 w-full p-3 rounded-xl">
//             <RiShieldCheckLine className="text-white/50 h-5 w-5" />
//             <div className="flex-1">
//               <p className="text-white text-sm font-medium">Security Questions</p>
//               <p className="text-white/40 text-xs">
//                 {securityStatus?.isSet ? 'Configured' : 'Not set up yet'}
//               </p>
//             </div>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Danger zone */}
//       <Card className="border-red-500/20">
//         <CardHeader>
//           <CardTitle className="text-base text-red-400">Danger Zone</CardTitle>
//         </CardHeader>
//         <CardContent className="pt-0 space-y-2">
//           <Button variant="outline" className="w-full justify-start border-amber-500/30 text-amber-400" onClick={() => setDeactivateOpen(true)}>
//             <RiAlertLine className="h-4 w-4" />
//             Deactivate Account
//           </Button>
//           <Button variant="outline" className="w-full justify-start border-red-500/30 text-red-400" onClick={() => setDeleteOpen(true)}>
//             <RiDeleteBin6Line className="h-4 w-4" />
//             Delete Account Permanently
//           </Button>
//           <Button
//             variant="ghost"
//             className="w-full justify-start text-white/60"
//             onClick={async () => { await logout(); navigate('/login'); }}
//           >
//             <RiLogoutBoxLine className="h-4 w-4" />
//             Logout
//           </Button>
//         </CardContent>
//       </Card>

//       {/* Edit profile dialog */}
//       <Dialog open={editOpen} onOpenChange={setEditOpen}>
//         <DialogContent>
//           <DialogHeader>
//             <DialogTitle>Edit Profile</DialogTitle>
//           </DialogHeader>
//           <div className="space-y-4">
//             {user.role === 'investor' && user.investorType === 'individual' && (
//               <>
//                 <div className="space-y-2">
//                   <Label>First Name</Label>
//                   <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
//                 </div>
//                 <div className="space-y-2">
//                   <Label>Last Name</Label>
//                   <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
//                 </div>
//               </>
//             )}
//             {user.role === 'partner' && (
//               <>
//                 <div className="space-y-2">
//                   <Label>First Name</Label>
//                   <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
//                 </div>
//                 <div className="space-y-2">
//                   <Label>Last Name</Label>
//                   <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
//                 </div>
//               </>
//             )}
//             <div className="space-y-2">
//               <Label>Phone</Label>
//               <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
//             </div>
//           </div>
//           <DialogFooter>
//             <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
//             <Button
//               onClick={() => updateProfileMutation.mutate({ firstName, lastName, phone })}
//               disabled={updateProfileMutation.isPending}
//             >
//               {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>

//       {/* Change password dialog */}
//       <Dialog open={pwOpen} onOpenChange={setPwOpen}>
//         <DialogContent>
//           <DialogHeader>
//             <DialogTitle>Change Password</DialogTitle>
//           </DialogHeader>
//           <div className="space-y-4">
//             <div className="space-y-2">
//               <Label>Current Password</Label>
//               <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
//             </div>
//             <div className="space-y-2">
//               <Label>New Password</Label>
//               <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
//             </div>
//             <div className="space-y-2">
//               <Label>Confirm New Password</Label>
//               <Input type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} />
//             </div>
//           </div>
//           <DialogFooter>
//             <Button variant="outline" onClick={() => setPwOpen(false)}>Cancel</Button>
//             <Button
//               onClick={() =>
//                 changePasswordMutation.mutate({ currentPassword, newPassword, confirmNewPassword })
//               }
//               disabled={changePasswordMutation.isPending}
//             >
//               {changePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>

//       {/* Deactivate dialog */}
//       <Dialog open={deactivateOpen} onOpenChange={setDeactivateOpen}>
//         <DialogContent>
//           <DialogHeader>
//             <DialogTitle>Deactivate Account</DialogTitle>
//             <DialogDescription>
//               Your account will be temporarily disabled. You can reactivate by logging in again.
//             </DialogDescription>
//           </DialogHeader>
//           <DialogFooter>
//             <Button variant="outline" onClick={() => setDeactivateOpen(false)}>Cancel</Button>
//             <Button
//               className="bg-amber-500 hover:bg-amber-600 text-black"
//               onClick={() => deactivateMutation.mutate()}
//               disabled={deactivateMutation.isPending}
//             >
//               {deactivateMutation.isPending ? 'Deactivating...' : 'Deactivate'}
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>

//       {/* Delete dialog */}
//       <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
//         <DialogContent>
//           <DialogHeader>
//             <DialogTitle>Delete Account</DialogTitle>
//             <DialogDescription>
//               This action is permanent and cannot be undone. All your data will be erased.
//             </DialogDescription>
//           </DialogHeader>
//           <DialogFooter>
//             <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
//             <Button
//               className="bg-red-500 hover:bg-red-600"
//               onClick={() => deleteMutation.mutate()}
//               disabled={deleteMutation.isPending}
//             >
//               {deleteMutation.isPending ? 'Deleting...' : 'Delete Permanently'}
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// }



export default function Profile() {
  return (
    <div>Profile</div>
  )
}
