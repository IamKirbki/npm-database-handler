import Model from "./Model";

export default class User extends Model<{ id: string; name: string; }> {
    public someMethod(): void {
        console.log("This is a method in the User model.");
    }
}