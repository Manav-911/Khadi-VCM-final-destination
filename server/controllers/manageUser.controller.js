const supabase = require("../config/db.js");

const getAllUsersOfOffice = async (req, res) => {
  const officeId = req.user.officeId;
  try {
    const { data, error } = await supabase
      .from("users")
      .select(`id,name,email,phone`)
      .eq("office", officeId);

    if (error) {
      return res.status.json({
        success: false,
        message: "ERROR in fetching Users",
      });
    }

    return res.status(200).json({ success: true, users: data });
  } catch (err) {
    console.error("User fetching error: ", err);
    return res
      .status(500)
      .json({ success: false, message: "ERROR in User fetching" });
  }
};

const addUser = async (req, res) => {
  const officeId = req.user.officeId;

  const { name, email, password, phone } = req.body;

  try {
    const { data, error } = await supabase
      .from("users")
      .insert([{ name, email, password, office: officeId, phone }]);

    if (error) {
      return res
        .status(400)
        .json({ success: false, message: "ERROR in adding user (DB)" });
    }

    return res
      .status(200)
      .json({ success: true, message: "USER added successfully." });
  } catch (err) {
    console.error("ERROR in user add", err);
    return res
      .status(500)
      .json({ success: false, message: "ERROR in adding user" });
  }
};

const deleteUser = async (req, res) => {
  const id = req.body.id;

  try {
    const { data, error } = await supabase.from("users").delete().eq("id", id);

    if (error) {
      console.log(error);
      return res
        .status(400)
        .json({ success: false, message: "EROR in deleting user (DB)" });
    }

    return res
      .status(200)
      .json({ success: true, message: "User Deleted successfully" });
  } catch (error) {
    console.error("ERROR in deleting user: ", error);
    return res
      .status(500)
      .json({ success: false, message: "ERROR in deleting user exception" });
  }
};

module.exports = { getAllUsersOfOffice, addUser, deleteUser };
