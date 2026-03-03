const Roles = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  USER: 'user',
  BANNED: 'banned'
};

const RoleHierarchy = {
  [Roles.SUPER_ADMIN]: 3,
  [Roles.ADMIN]: 2,
  [Roles.USER]: 1,
  [Roles.BANNED]: 0
};

module.exports = { Roles, RoleHierarchy };
