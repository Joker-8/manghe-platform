/**
 * 用户模型
 * 定义用户数据结构和相关方法
 */

class User {
  constructor(data = {}) {
    this.id = data.id || null;
    this.username = data.username || '';
    this.email = data.email || '';
    this.password = data.password || ''; // 存储加密后的密码
    this.avatar = data.avatar || '';
    this.points = data.points || 0;
    this.level = data.level || '普通会员';
    this.followers = data.followers || 0;
    this.following = data.following || 0;
    this.posts = data.posts || 0;
    this.created_at = data.created_at || new Date().toISOString();
    this.updated_at = data.updated_at || new Date().toISOString();
  }

  /**
   * 获取用户的基本信息（不包含敏感数据）
   */
  getPublicInfo() {
    return {
      id: this.id,
      username: this.username,
      email: this.email,
      avatar: this.avatar,
      points: this.points,
      level: this.level,
      followers: this.followers,
      following: this.following,
      posts: this.posts,
      created_at: this.created_at
    };
  }

  /**
   * 验证密码
   * @param {Function} comparePassword - bcrypt.compare方法的引用
   * @param {string} candidatePassword - 待验证的密码
   * @returns {Promise<boolean>} 密码是否匹配
   */
  async validatePassword(comparePassword, candidatePassword) {
    try {
      return await comparePassword(candidatePassword, this.password);
    } catch (error) {
      console.error('密码验证错误:', error);
      return false;
    }
  }

  /**
   * 更新用户信息
   * @param {Object} updates - 要更新的字段
   */
  update(updates) {
    Object.assign(this, updates);
    this.updated_at = new Date().toISOString();
  }

  /**
   * 增加积分
   * @param {number} amount - 要增加的积分数量
   */
  addPoints(amount) {
    this.points += amount;
    this.updateLevel();
    this.updated_at = new Date().toISOString();
  }

  /**
   * 更新用户等级
   */
  updateLevel() {
    if (this.points >= 5000) {
      this.level = '钻石会员';
    } else if (this.points >= 3000) {
      this.level = '黄金会员';
    } else if (this.points >= 1000) {
      this.level = '白银会员';
    } else {
      this.level = '普通会员';
    }
  }

  /**
   * 增加关注数
   */
  incrementFollowers() {
    this.followers += 1;
    this.updated_at = new Date().toISOString();
  }

  /**
   * 减少关注数
   */
  decrementFollowers() {
    if (this.followers > 0) {
      this.followers -= 1;
      this.updated_at = new Date().toISOString();
    }
  }

  /**
   * 增加正在关注数
   */
  incrementFollowing() {
    this.following += 1;
    this.updated_at = new Date().toISOString();
  }

  /**
   * 减少正在关注数
   */
  decrementFollowing() {
    if (this.following > 0) {
      this.following -= 1;
      this.updated_at = new Date().toISOString();
    }
  }

  /**
   * 增加帖子数
   */
  incrementPosts() {
    this.posts += 1;
    this.updated_at = new Date().toISOString();
  }

  /**
   * 减少帖子数
   */
  decrementPosts() {
    if (this.posts > 0) {
      this.posts -= 1;
      this.updated_at = new Date().toISOString();
    }
  }

  /**
   * 将用户数据转换为数据库插入格式
   */
  toDbFormat() {
    return {
      username: this.username,
      email: this.email,
      password: this.password,
      avatar: this.avatar,
      points: this.points,
      level: this.level,
      followers: this.followers,
      following: this.following,
      posts: this.posts,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }

  /**
   * 从数据库结果创建User实例
   * @param {Object} dbResult - 数据库查询结果
   * @returns {User} User实例
   */
  static fromDbResult(dbResult) {
    return new User(dbResult);
  }
}

export default User;