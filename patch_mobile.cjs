const fs = require('fs');
const path = require('path');
const file = '/Users/maryow/Documents/3_Development/CoramDeoMobile/src/app/(auth)/forgot-password.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `<PrimaryGradientButton
                  title="Send Reset Link"
                  onPress={handleSendResetLink}
                  loading={isLoading}
                  style={{ marginTop: 16 }}
                />
              </View>`;

const replacement = `<PrimaryGradientButton
                  title="Send Reset Link"
                  onPress={handleSendResetLink}
                  loading={isLoading}
                  style={{ marginTop: 16 }}
                />
                
                <TouchableOpacity
                  onPress={() => router.push('/(auth)/forgot-password-sms')}
                  style={{ marginTop: 24, alignItems: 'center' }}
                  accessibilityRole="button"
                >
                  <Text style={{ color: '#B66DFF', fontWeight: '600', fontSize: 15 }}>
                    Use SMS (Phone Number) Instead
                  </Text>
                </TouchableOpacity>
              </View>`;

content = content.replace(target, replacement);
fs.writeFileSync(file, content, 'utf8');
console.log('Patched forgot-password.tsx successfully.');
