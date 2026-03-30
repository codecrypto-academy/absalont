#[derive(Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct Datetime {
    pub date: Option<Date>,
    pub time: Option<Time>,
    pub offset: Option<Offset>,
}

#[derive(Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct Date { pub year: u16, pub month: u8, pub day: u8 }

#[derive(Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct Time { pub hour: u8, pub minute: u8, pub second: u8, pub nanosecond: u32 }

#[derive(Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub enum Offset { Z, Custom { minutes: i16 } }

impl std::fmt::Display for Datetime {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result { write!(f, "datetime") }
}

impl std::fmt::Debug for Datetime {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result { write!(f, "datetime") }
}

#[cfg(feature = "serde")]
impl serde::Serialize for Datetime {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error> where S: serde::Serializer {
        serializer.serialize_str("datetime")
    }
}
