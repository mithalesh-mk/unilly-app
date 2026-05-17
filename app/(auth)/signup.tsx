import React, { useEffect, useState } from "react";

import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { Link, router } from "expo-router";

import { radii, spacing, useTheme } from "../../utils/Theme/theme";

import {
  generateOtp,
  getApiError,
  signup,
  verifyOtp,
} from "@/services/auths/auth.service";
import CustomDropdown from "@/components/UI/CustomDropdown";

const currentYear = new Date().getFullYear();

const courseOptions = [
  "B.Tech",
  "B.A",
  "BBA",
  "MBA",
  "BCA",
  "B.Com",
  "MBBS",
  "B.Pharma",
];

const yearOptions = Array.from({ length: 11 }, (_, i) =>
  (currentYear + i).toString(),
);

type FormErrors = {
  college?: string;
  email?: string;
  otp?: string;
  name?: string;
  username?: string;
  course?: string;
  password?: string;
  confirmPassword?: string;
  api?: string;
};

export default function Signup() {
  const { colors } = useTheme();

  const [step, setStep] = useState(1);

  const [otpStatus, setOtpStatus] = useState<
    "idle" | "sending" | "sent" | "verified"
  >("idle");

  const [timer, setTimer] = useState(0);

  const [verifyLoading, setVerifyLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  const [college, setCollege] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");

  const [selectedYear, setSelectedYear] = useState(currentYear.toString());

  const [selectedCourse, setSelectedCourse] = useState("");

  const [createPassword, setCreatePassword] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [showConfirm, setShowConfirm] = useState(false);

  const [errors, setErrors] = useState<FormErrors>({});

  const setFieldError = (field: keyof FormErrors, value?: string) => {
    setErrors((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const clearStepOneMessages = () => {
    setErrors((prev) => ({
      ...prev,
      college: undefined,
      email: undefined,
      otp: undefined,
      api: undefined,
    }));
  };

  const clearStepTwoMessages = () => {
    setErrors((prev) => ({
      ...prev,
      name: undefined,
      username: undefined,
      course: undefined,
      password: undefined,
      confirmPassword: undefined,
      api: undefined,
    }));
  };

  const validateStepOne = () => {
    const nextErrors: FormErrors = {};

    const trimmedCollege = college.trim();

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedCollege) {
      nextErrors.college = "College name is required.";
    }

    if (!trimmedEmail) {
      nextErrors.email = "College email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      nextErrors.email = "Enter a valid email address.";
    }

    setErrors((prev) => ({
      ...prev,
      college: nextErrors.college,
      email: nextErrors.email,
      otp: undefined,
      api: undefined,
    }));

    return Object.keys(nextErrors).length === 0;
  };

  const validateOtp = () => {
    let otpError: string | undefined;

    if (!otp.trim()) {
      otpError = "OTP is required.";
    } else if (!/^\d{6}$/.test(otp.trim())) {
      otpError = "OTP must be 6 digits.";
    }

    setErrors((prev) => ({
      ...prev,
      otp: otpError,
      api: undefined,
    }));

    return !otpError;
  };

  const validateStepTwo = () => {
    const nextErrors: FormErrors = {};

    const trimmedName = name.trim();

    const trimmedUsername = username.trim();

    const trimmedPassword = createPassword.trim();

    const trimmedConfirmPassword = confirmPassword.trim();

    if (!trimmedName) {
      nextErrors.name = "Full name is required.";
    }

    if (!trimmedUsername) {
      nextErrors.username = "Username is required.";
    } else if (trimmedUsername.length < 3) {
      nextErrors.username = "Username must be at least 3 characters.";
    }

    if (!selectedCourse) {
      nextErrors.course = "Please select a course.";
    }

    if (!trimmedPassword) {
      nextErrors.password = "Password is required.";
    } else if (trimmedPassword.length < 6) {
      nextErrors.password = "Password must be at least 6 characters.";
    }

    if (!trimmedConfirmPassword) {
      nextErrors.confirmPassword = "Please confirm your password.";
    } else if (trimmedPassword !== trimmedConfirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors((prev) => ({
      ...prev,
      name: nextErrors.name,
      username: nextErrors.username,
      course: nextErrors.course,
      password: nextErrors.password,
      confirmPassword: nextErrors.confirmPassword,
      api: undefined,
    }));

    return Object.keys(nextErrors).length === 0;
  };

  useEffect(() => {
    let interval: any;

    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [timer]);

  const handleSendOtp = async () => {
    if (!validateStepOne()) {
      return;
    }

    if (timer > 0) {
      return;
    }

    setOtpStatus("sending");

    try {
      await generateOtp({
        email: email.trim().toLowerCase(),
      });

      setOtpStatus("sent");

      setTimer(30);
    } catch (error) {
      setOtpStatus("idle");

      const { code, message } = getApiError(error);

      if (code === "USER_ALREADY_EXISTS") {
        setFieldError("api", "An account with this email already exists.");

        return;
      }

      setFieldError("api", message);
    }
  };

  const handleVerifyOtp = async () => {
    if (!validateOtp()) {
      return;
    }

    setVerifyLoading(true);

    try {
      await verifyOtp({
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
      });

      setOtpStatus("verified");

      setErrors((prev) => ({
        ...prev,
        otp: undefined,
        api: undefined,
      }));

      setStep(2);
    } catch (error) {
      const { code, message } = getApiError(error);

      if (code === "OTP_INVALID") {
        setFieldError("otp", "Wrong OTP. Please try again.");
      } else if (code === "OTP_EXPIRED") {
        setFieldError("otp", "OTP expired. Request a new one.");
      } else if (code === "OTP_ATTEMPTS_EXCEEDED") {
        setFieldError("otp", "Too many attempts. Request a new OTP.");
      } else {
        setFieldError("otp", message);
      }
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleCreateAccount = async () => {
    if (!validateStepTwo()) {
      return;
    }

    setCreateLoading(true);

    try {
      await signup({
        username: username.trim(),
        email: email.trim().toLowerCase(),
        name: name.trim(),
        course: selectedCourse,
        yop: Number(selectedYear),
        password: createPassword.trim(),
        confirm_password: confirmPassword.trim(),
      });

      await setErrors({});
      await setStep(3);
      router.replace("/(auth)");
    } catch (error) {
      const { code, message } = getApiError(error);

      if (code === "USER_ALREADY_EXISTS") {
        setFieldError("api", "User already exists.");
      } else {
        setFieldError("api", message);
      }
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.bg,
        },
      ]}
    >
      <View style={styles.content}>
        <Text
          style={[
            styles.title,
            {
              color: colors.text,
            },
          ]}
        >
          {step === 1
            ? "Create Account"
            : step === 2
              ? "Complete Profile"
              : "Account Created"}
        </Text>

        <Text
          style={[
            styles.subtitle,
            {
              color: colors.subText,
            },
          ]}
        >
          {step === 1
            ? "Verify your college email"
            : step === 2
              ? "Setup your profile"
              : "You can now login"}
        </Text>

        <View style={styles.form}>
          {step === 1 && (
            <>
              <TextInput
                placeholder="College Name"
                placeholderTextColor={colors.subText}
                value={college}
                onChangeText={(value) => {
                  setCollege(value);

                  clearStepOneMessages();
                }}
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
              />

              {!!errors.college && (
                <Text
                  style={[
                    styles.errorText,
                    {
                      color: colors.error,
                    },
                  ]}
                >
                  {errors.college}
                </Text>
              )}

              <TextInput
                placeholder="College Email"
                placeholderTextColor={colors.subText}
                value={email}
                onChangeText={(value) => {
                  setEmail(value);

                  clearStepOneMessages();
                }}
                autoCapitalize="none"
                keyboardType="email-address"
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
              />

              {!!errors.email && (
                <Text
                  style={[
                    styles.errorText,
                    {
                      color: colors.error,
                    },
                  ]}
                >
                  {errors.email}
                </Text>
              )}

              {!!errors.api && (
                <Text
                  style={[
                    styles.errorText,
                    {
                      color: colors.error,
                    },
                  ]}
                >
                  {errors.api}
                </Text>
              )}

              {otpStatus !== "sent" && otpStatus !== "verified" && (
                <TouchableOpacity
                  onPress={handleSendOtp}
                  disabled={otpStatus === "sending" || timer > 0}
                  style={[
                    styles.button,
                    {
                      backgroundColor: colors.primary,
                      opacity: otpStatus === "sending" || timer > 0 ? 0.5 : 1,
                    },
                  ]}
                >
                  {otpStatus === "sending" ? (
                    <ActivityIndicator color={colors.bg} />
                  ) : (
                    <Text
                      style={[
                        styles.buttonText,
                        {
                          color: colors.bg,
                        },
                      ]}
                    >
                      Send OTP
                    </Text>
                  )}
                </TouchableOpacity>
              )}

              {otpStatus === "sent" && (
                <>
                  <TextInput
                    placeholder="Enter OTP"
                    placeholderTextColor={colors.subText}
                    value={otp}
                    onChangeText={(value) => {
                      setOtp(value);

                      setErrors((prev) => ({
                        ...prev,
                        otp: undefined,
                        api: undefined,
                      }));
                    }}
                    keyboardType="number-pad"
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                        color: colors.text,
                      },
                    ]}
                  />

                  {!!errors.otp && (
                    <Text
                      style={[
                        styles.errorText,
                        {
                          color: colors.error,
                        },
                      ]}
                    >
                      {errors.otp}
                    </Text>
                  )}

                  <TouchableOpacity
                    onPress={handleVerifyOtp}
                    style={[
                      styles.button,
                      {
                        backgroundColor: colors.primary,
                      },
                    ]}
                  >
                    {verifyLoading ? (
                      <ActivityIndicator color={colors.bg} />
                    ) : (
                      <Text
                        style={[
                          styles.buttonText,
                          {
                            color: colors.bg,
                          },
                        ]}
                      >
                        Verify OTP
                      </Text>
                    )}
                  </TouchableOpacity>

                  <Text
                    style={[
                      styles.timerText,
                      {
                        color: colors.subText,
                      },
                    ]}
                  >
                    {timer > 0 ? `Resend in ${timer}s` : "Resend OTP"}
                  </Text>
                </>
              )}
            </>
          )}

          {step === 2 && (
            <>
              <TextInput
                placeholder="Full Name"
                placeholderTextColor={colors.subText}
                value={name}
                onChangeText={(value) => {
                  setName(value);

                  clearStepTwoMessages();
                }}
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
              />

              {!!errors.name && (
                <Text
                  style={[
                    styles.errorText,
                    {
                      color: colors.error,
                    },
                  ]}
                >
                  {errors.name}
                </Text>
              )}

              <TextInput
                placeholder="Username"
                placeholderTextColor={colors.subText}
                value={username}
                onChangeText={(value) => {
                  setUsername(value);

                  clearStepTwoMessages();
                }}
                autoCapitalize="none"
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
              />

              {!!errors.username && (
                <Text
                  style={[
                    styles.errorText,
                    {
                      color: colors.error,
                    },
                  ]}
                >
                  {errors.username}
                </Text>
              )}

              <CustomDropdown
                label="Course"
                data={courseOptions}
                value={selectedCourse}
                onSelect={(value: any) => {
                  setSelectedCourse(value);

                  clearStepTwoMessages();
                }}
                placeholder="Select course"
              />

              {!!errors.course && (
                <Text
                  style={[
                    styles.errorText,
                    {
                      color: colors.error,
                    },
                  ]}
                >
                  {errors.course}
                </Text>
              )}

              <CustomDropdown
                label="Passing Year"
                data={yearOptions}
                value={selectedYear}
                onSelect={setSelectedYear}
                placeholder="Select year"
              />

              <View
                style={[
                  styles.passwordContainer,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
              >
                <TextInput
                  placeholder="Password"
                  placeholderTextColor={colors.subText}
                  value={createPassword}
                  onChangeText={(value) => {
                    setCreatePassword(value);

                    clearStepTwoMessages();
                  }}
                  secureTextEntry={!showPassword}
                  style={[
                    styles.passwordInput,
                    {
                      color: colors.text,
                    },
                  ]}
                />

                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? "eye-off" : "eye"}
                    size={20}
                    color={colors.subText}
                  />
                </TouchableOpacity>
              </View>

              {!!errors.password && (
                <Text
                  style={[
                    styles.errorText,
                    {
                      color: colors.error,
                    },
                  ]}
                >
                  {errors.password}
                </Text>
              )}

              <View
                style={[
                  styles.passwordContainer,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
              >
                <TextInput
                  placeholder="Confirm Password"
                  placeholderTextColor={colors.subText}
                  value={confirmPassword}
                  onChangeText={(value) => {
                    setConfirmPassword(value);

                    clearStepTwoMessages();
                  }}
                  secureTextEntry={!showConfirm}
                  style={[
                    styles.passwordInput,
                    {
                      color: colors.text,
                    },
                  ]}
                />

                <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                  <Ionicons
                    name={showConfirm ? "eye-off" : "eye"}
                    size={20}
                    color={colors.subText}
                  />
                </TouchableOpacity>
              </View>

              {!!errors.confirmPassword && (
                <Text
                  style={[
                    styles.errorText,
                    {
                      color: colors.error,
                    },
                  ]}
                >
                  {errors.confirmPassword}
                </Text>
              )}

              {!!errors.api && (
                <Text
                  style={[
                    styles.errorText,
                    {
                      color: colors.error,
                    },
                  ]}
                >
                  {errors.api}
                </Text>
              )}

              <TouchableOpacity
                onPress={handleCreateAccount}
                style={[
                  styles.button,
                  {
                    backgroundColor: colors.primary,
                  },
                ]}
              >
                {createLoading ? (
                  <ActivityIndicator color={colors.bg} />
                ) : (
                  <Text
                    style={[
                      styles.buttonText,
                      {
                        color: colors.bg,
                      },
                    ]}
                  >
                    Create Account
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setStep(1)}>
                <Text
                  style={[
                    styles.backText,
                    {
                      color: colors.subText,
                    },
                  ]}
                >
                  ← Back
                </Text>
              </TouchableOpacity>
            </>
          )}

          {step === 3 && (
            <>
              <View
                style={[
                  styles.successBox,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text
                  style={{
                    color: colors.text,
                    textAlign: "center",
                  }}
                >
                  Account created successfully
                </Text>
              </View>

              <Link href="/(auth)" asChild>
                <TouchableOpacity
                  style={[
                    styles.button,
                    {
                      backgroundColor: colors.primary,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      {
                        color: colors.bg,
                      },
                    ]}
                  >
                    Go to Login
                  </Text>
                </TouchableOpacity>
              </Link>
            </>
          )}

          {step !== 3 && (
            <Text
              style={{
                color: colors.subText,
                textAlign: "center",
              }}
            >
              Already have an account?{" "}
              <Link
                href="/(auth)"
                style={{
                  color: colors.text,
                  fontWeight: "700",
                }}
              >
                Login
              </Link>
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },

  title: {
    fontSize: 34,
    fontWeight: "800",
  },

  subtitle: {
    fontSize: 15,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },

  form: {
    gap: spacing.md,
  },

  input: {
    height: 52,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    fontSize: 16,
  },

  passwordContainer: {
    height: 52,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
  },

  passwordInput: {
    flex: 1,
    fontSize: 16,
  },

  button: {
    height: 52,
    borderRadius: radii.md,
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.sm,
  },

  buttonText: {
    fontSize: 16,
    fontWeight: "700",
  },

  errorText: {
    marginTop: -8,
    fontSize: 13,
  },

  timerText: {
    textAlign: "center",
    marginTop: spacing.sm,
  },

  backText: {
    textAlign: "center",
    marginTop: spacing.sm,
  },

  successBox: {
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.lg,
  },
});
