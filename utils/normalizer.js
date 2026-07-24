export function normalizeString(value) {
    if (typeof value !== "string") return value;

    return value.trim().replace(/\s+/g, " ");
}

export function normalizeName(name) {
    if (!name) return name;

    return normalizeString(name)
        .toLowerCase()
        .split(" ")
        .map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        )
        .join(" ");
}

export function normalizePhone(phone) {
    if (!phone) return phone;

    return phone.replace(/\D/g, "");
}

export function normalizeEmail(email) {
    if (!email) return email;

    return email.trim().toLowerCase();
}

export function normalizeGender(gender) {
    if (!gender) return gender;

    const value = gender.trim().toLowerCase();

    const map = {
        m: "male",
        male: "male",

        f: "female",
        female: "female",

        o: "other",
        other: "other",
    };

    return map[value] ?? value;
}

export function normalizeDate(date) {
    if (!date) return date;

    return date.trim();
}

export function normalizeBloodGroup(group) {
    if (!group) return group;

    const value = group.trim().toUpperCase();

    const map = {
        APOSITIVE: "A+",
        "A POSITIVE": "A+",
        APLUS: "A+",
        "A+": "A+",

        ANEGATIVE: "A-",
        "A NEGATIVE": "A-",
        "A-": "A-",

        BPOSITIVE: "B+",
        "B POSITIVE": "B+",
        "B+": "B+",

        BNEGATIVE: "B-",
        "B NEGATIVE": "B-",
        "B-": "B-",

        ABPOSITIVE: "AB+",
        "AB POSITIVE": "AB+",
        "AB+": "AB+",

        ABNEGATIVE: "AB-",
        "AB NEGATIVE": "AB-",
        "AB-": "AB-",

        OPOSITIVE: "O+",
        "O POSITIVE": "O+",
        "O+": "O+",

        ONEGATIVE: "O-",
        "O NEGATIVE": "O-",
        "O-": "O-",
    };

    return map[value.replace(/\s+/g, "")] ?? group;
}

export function normalizePatient(data) {
    return {
        ...data,

        name: normalizeName(data.name),

        gender: normalizeGender(data.gender),

        phone: normalizePhone(data.phone),

        email: normalizeEmail(data.email),

        address: normalizeString(data.address),

        bloodGroup: normalizeBloodGroup(data.bloodGroup),

        emergencyContact: data.emergencyContact
        ? {
            name: normalizeName(data.emergencyContact.name),
            relation: normalizeString(data.emergencyContact.relation),
            phone: normalizePhone(data.emergencyContact.phone),
        }
        : undefined,

        dateOfBirth: normalizeDate(data.dateOfBirth),
    };
}